// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interfaces pour typer les données
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  roleId?: number;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

export interface MessageResponse {
  message: string;
}

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
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'gdpr_auth_token';
  private readonly USER_KEY = 'gdpr_user_info';

  // Sujet pour suivre l'état d'authentification
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.getUserFromStorage());

  // Observables publics
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Vérifier la validité du token au démarrage
    this.checkTokenValidity();
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials, this.httpOptions)
      .pipe(
        tap(response => {
          // Sauvegarder le token et les infos utilisateur
          this.setSession(response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Inscription utilisateur
   */
  register(userData: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/register`, userData, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/logout`, {}, this.getAuthHttpOptions())
      .pipe(
        tap(() => {
          this.clearSession();
        }),
        catchError((error) => {
          // Même en cas d'erreur, on déconnecte localement
          this.clearSession();
          return this.handleError(error);
        })
      );
  }

  /**
   * Rafraîchir le token
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
          // Mettre à jour le token
          this.setToken(response.token);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Valider le token
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
          // Mettre à jour les infos utilisateur
          this.setUserInfo(userInfo);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Changer le mot de passe
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/change-password`, 
      passwordData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mot de passe oublié
   */
  forgotPassword(emailData: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/forgot-password`, 
      emailData, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir le token d'authentification
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.hasToken() && !this.isTokenExpired();
  }

  /**
   * Obtenir les informations de l'utilisateur actuel
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Vérifier si l'utilisateur est gérant
   */
  isManager(): boolean {
    return this.hasRole('GERANT');
  }

  /**
   * Vérifier si l'utilisateur est client
   */
  isClient(): boolean {
    return this.hasRole('CLIENT');
  }

  /**
   * Déconnexion locale (sans appel API)
   */
  logoutLocal(): void {
    this.clearSession();
  }

  /**
   * Déconnexion et redirection
   */
  logoutAndRedirect(): void {
    this.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // En cas d'erreur, on redirige quand même
        this.router.navigate(['/login']);
      }
    });
  }

  // ================== MÉTHODES PRIVÉES ==================

  /**
   * Configurer la session après connexion
   */
  private setSession(authResult: LoginResponse): void {
    this.setToken(authResult.token);
    
    const userInfo: UserInfo = {
      id: authResult.id,
      email: authResult.email,
      firstname: authResult.firstname,
      lastname: authResult.lastname,
      role: authResult.role,
      active: true
    };
    
    this.setUserInfo(userInfo);
    this.isLoggedInSubject.next(true);
  }

  /**
   * Nettoyer la session
   */
  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Sauvegarder le token
   */
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Sauvegarder les infos utilisateur
   */
  private setUserInfo(userInfo: UserInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    }
    this.currentUserSubject.next(userInfo);
  }

  /**
   * Récupérer les infos utilisateur du localStorage
   */
  private getUserFromStorage(): UserInfo | null {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    }
    return null;
  }

  /**
   * Vérifier si un token existe
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Vérifier si le token est expiré
   */
  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir en millisecondes
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  /**
   * Vérifier la validité du token au démarrage
   */
  private checkTokenValidity(): void {
    if (this.hasToken() && !this.isTokenExpired()) {
      // Valider le token auprès du serveur
      this.validateToken().subscribe({
        next: () => {
          this.isLoggedInSubject.next(true);
        },
        error: () => {
          this.clearSession();
        }
      });
    } else if (this.hasToken()) {
      // Token expiré
      this.clearSession();
    }
  }

  /**
   * Obtenir les headers avec authentification
   */
  private getAuthHttpOptions(): {headers: HttpHeaders} {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  /**
   * Gestionnaire d'erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 401:
          errorMessage = 'Email ou mot de passe incorrect';
          this.clearSession(); // Déconnecter en cas d'erreur 401
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Service non trouvé';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    console.error('Erreur AuthService:', error);
    return throwError(() => new Error(errorMessage));
  }
}