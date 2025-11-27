// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interface for login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Interface for user registration payload
export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  roleId?: number; // Optional - defaults to client role
}

// Interface for successful login response from server
export interface LoginResponse {
  token: string;    // JWT token
  type: string;     // Token type (usually "Bearer")
  id: number;       // User ID
  email: string;
  firstname: string;
  lastname: string;
  role: string;     // User role (ADMIN, GERANT, CLIENT)
}

// Generic message response interface
export interface MessageResponse {
  message: string;
}

// Interface for user information stored in app
export interface UserInfo {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  active: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

@Injectable({
  providedIn: 'root' // Singleton service available app-wide
})
export class AuthService {
  // API configuration
  private readonly API_URL = 'https://q3-saadabadis.onrender.com/api/auth';
  private readonly TOKEN_KEY = 'gdpr_auth_token';    // localStorage key for token
  private readonly USER_KEY = 'gdpr_user_info';     // localStorage key for user info

  // BehaviorSubjects for reactive state management
  // BehaviorSubject holds current value and emits it to new subscribers
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getUserFromStorage());

  // Public observables for components to subscribe to
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  // Default HTTP options for non-authenticated requests
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private router: Router // For navigation after auth events
  ) {
    // Check token validity when service initializes
    this.checkTokenValidity();
  }

  /**
   * User login method
   * Uses tap operator to perform side effects (save session) without modifying stream
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials, this.httpOptions)
      .pipe(
        tap(response => {
          // Side effect: save session data when login succeeds
          this.setSession(response);
        }),
        catchError(this.handleError) // Handle any errors
      );
  }

  /**
   * User registration method
   * Returns message response instead of user data for security
   */
  register(userData: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/register`, userData, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Logout method with server-side cleanup
   * Ensures session is cleared even if server request fails
   */
  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/logout`, {}, this.getAuthHttpOptions())
      .pipe(
        tap(() => {
          // Clear session on successful logout
          this.clearSession();
        }),
        catchError((error) => {
          // Important: clear session even if server request fails
          // This prevents users from being stuck in logged-in state
          this.clearSession();
          return this.handleError(error);
        })
      );
  }

  /**
   * Refresh JWT token to extend session
   * Used to maintain authentication without re-login
   */
  refreshToken(): Observable<{token: string, type: string}> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http.post<{token: string, type: string}>(`${this.API_URL}/refresh`, 
      { token }, this.httpOptions)
      .pipe(
        tap(response => {
          // Update token in storage with new token
          this.setToken(response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Validate token with server and get updated user info
   * Used to verify token is still valid and get current user data
   */
  validateToken(token?: string): Observable<UserInfo> {
    const tokenToValidate = token || this.getToken();
    if (!tokenToValidate) {
      return throwError(() => new Error('No token to validate'));
    }

    return this.http.post<UserInfo>(`${this.API_URL}/validate`, 
      { token: tokenToValidate }, this.httpOptions)
      .pipe(
        tap(userInfo => {
          // Update stored user info with server response
          this.setUserInfo(userInfo);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Change user password (requires current password)
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/change-password`, 
      passwordData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Forgot password - sends reset email
   * Public endpoint, doesn't require authentication
   */
  forgotPassword(emailData: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/forgot-password`, 
      emailData, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get current authentication token from localStorage
   * Handles server-side rendering by checking for window object
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Check if user is currently authenticated
   * Combines token existence check with expiration validation
   */
  isAuthenticated(): boolean {
    return this.hasToken() && !this.isTokenExpired();
  }

  /**
   * Get current user information
   * Returns the current value from the BehaviorSubject
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user has specific role
   * Utility method for role-based access control
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Convenience method to check admin role
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Convenience method to check manager role
   */
  isManager(): boolean {
    return this.hasRole('GERANT'); // French term for manager
  }

  /**
   * Convenience method to check client role
   */
  isClient(): boolean {
    return this.hasRole('CLIENT');
  }

  /**
   * Local logout without server call
   * Used when server is unreachable or for emergency logout
   */
  logoutLocal(): void {
    this.clearSession();
  }

  /**
   * Logout and redirect to login page
   * Combines logout with navigation for better UX
   */
  logoutAndRedirect(): void {
    this.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Navigate even if logout request fails
        this.router.navigate(['/login']);
      }
    });
  }

  // ================== PRIVATE METHODS ==================

  /**
   * Set up user session after successful login
   * Stores both token and user info, updates reactive state
   */
  private setSession(authResult: LoginResponse): void {
    this.setToken(authResult.token);
    
    // Transform login response to user info format
    const userInfo: UserInfo = {
      id: authResult.id,
      email: authResult.email,
      firstname: authResult.firstname,
      lastname: authResult.lastname,
      role: authResult.role,
      active: true // Assume active if login successful
    };
    
    this.setUserInfo(userInfo);
    // Notify all subscribers that user is now logged in
    this.isLoggedInSubject.next(true);
  }

  /**
   * Clear all session data and update reactive state
   * Called on logout, token expiration, or auth errors
   */
  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    // Notify all subscribers that user is logged out
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Store JWT token in localStorage
   */
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Store user information and update reactive state
   */
  private setUserInfo(userInfo: UserInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    }
    // Update current user subject with new info
    this.currentUserSubject.next(userInfo);
  }

  /**
   * Retrieve user info from localStorage
   * Handles JSON parsing errors gracefully
   */
  private getUserFromStorage(): UserInfo | null {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem(this.USER_KEY);
      try {
        return userJson ? JSON.parse(userJson) : null;
      } catch {
        // If JSON is corrupted, return null
        return null;
      }
    }
    return null;
  }

  /**
   * Check if authentication token exists
   */
  private hasToken(): boolean {
    return !!this.getToken(); // Double negation converts to boolean
  }

  /**
   * Check if JWT token is expired
   * Decodes JWT payload to check expiration timestamp
   */
  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // JWT structure: header.payload.signature
      // Split token and decode the payload (middle part)
      const payload = JSON.parse(atob(token.split('.')[1])); // atob = base64 decode
      const exp = payload.exp * 1000; // Convert from seconds to milliseconds
      return Date.now() >= exp; // Check if current time is past expiration
    } catch {
      // If token is malformed or can't be decoded, consider it expired
      return true;
    }
  }

  /**
   * Validate token on service initialization
   * Ensures user stays logged in across browser sessions
   */
  private checkTokenValidity(): void {
    if (this.hasToken() && !this.isTokenExpired()) {
      // Token exists and not expired - validate with server
      this.validateToken().subscribe({
        next: () => {
          // Token is valid, update login state
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          // Token is invalid, clear session
          this.clearSession();
        }
      });
    } else if (this.hasToken()) {
      // Token exists but is expired, clear it
      this.clearSession();
    }
    // If no token exists, do nothing (user is not logged in)
  }

  /**
   * Create HTTP options with Bearer token authentication
   * Used for all authenticated API requests
   */
  private getAuthHttpOptions(): {headers: HttpHeaders} {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Standard JWT Bearer format
      })
    };
  }

  /**
   * Centralized error handling for HTTP requests
   * Provides user-friendly error messages based on HTTP status codes
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite'; // Default French error message

    if (error.error instanceof ErrorEvent) {
      // Client-side error (network, etc.)
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error - handle specific HTTP status codes
      switch (error.status) {
        case 401:
          errorMessage = 'Email ou mot de passe incorrect'; // Invalid credentials
          this.clearSession(); // Clear session on authentication failure
          break;
        case 403:
          errorMessage = 'Accès interdit'; // Forbidden access
          break;
        case 404:
          errorMessage = 'Service non trouvé'; // Service not found
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur'; // Internal server error
          break;
        default:
          // Use server-provided error message if available
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    // Log error for debugging (should use proper logging in production)
    console.error('Erreur AuthService:', error);
    // Return observable error for reactive error handling
    return throwError(() => new Error(errorMessage));
  }
}