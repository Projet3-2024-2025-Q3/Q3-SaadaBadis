// src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, throwError, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Import existing services and interfaces
import { RequestService, GDPRRequest } from './request.service';
import { CompanyService, Company } from './company.service';

// Admin-specific interfaces
export interface User {
  idUser: number;
  firstname: string;
  lastname: string;
  email: string;
  active: boolean;
  role: {
    idRole: number;
    roleName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDTO {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserDTO {
  firstname?: string;
  lastname?: string;
  email?: string;
  active?: boolean;
  roleId?: number;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AdminStatistics {
  userRequests: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    inProgress: number;
  };
  companyRequests: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    inProgress: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    managers: number;
    clients: number;
  };
  companies: {
    total: number;
  };
}

export interface SystemActivity {
  id: number;
  title: string;
  description: string;
  type: string;
  action: string;
  entityType: 'user' | 'company' | 'request';
  entityId: number;
  timestamp: string;
  userId?: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    admins: number;
    managers: number;
    clients: number;
  };
}

@Injectable({
  providedIn: 'root' // Makes service available app-wide as singleton
})
export class AdminService {
  // API endpoint configuration
  private readonly API_URL = 'https://q3-saadabadis.onrender.com/api';
  private readonly USERS_API = `${this.API_URL}/users`;
  private readonly ADMIN_API = `${this.API_URL}/admin`;

  // Default HTTP headers
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private requestService: RequestService, // Inject request service for GDPR operations
    private companyService: CompanyService  // Inject company service for company data
  ) {}

  // ================ USER MANAGEMENT ================

  /**
   * Get all users (Admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.USERS_API}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError) // Handle HTTP errors
      );
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.USERS_API}/${id}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): Observable<User> {
    // Encode email for URL safety
    return this.http.get<User>(`${this.USERS_API}/email/${encodeURIComponent(email)}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Create new user (Admin only)
   */
  createUser(userData: CreateUserDTO): Observable<User> {
    return this.http.post<User>(`${this.USERS_API}`, userData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update user (Admin only)
   */
  updateUser(id: number, userData: UpdateUserDTO): Observable<User> {
    return this.http.put<User>(`${this.USERS_API}/${id}`, userData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Deactivate user (Admin only)
   */
  deactivateUser(id: number): Observable<User> {
    // Empty body for status change endpoint
    return this.http.put<User>(`${this.USERS_API}/${id}/deactivate`, {}, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Activate user (Admin only)
   */
  activateUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.USERS_API}/${id}/activate`, {}, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Delete user permanently (Admin only)
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.USERS_API}/${id}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get users by role
   */
  getUsersByRole(roleId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.USERS_API}/role/${roleId}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get active users only
   */
  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.USERS_API}/active`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Change user password (Admin only)
   */
  changeUserPassword(id: number, passwordData: PasswordChangeRequest): Observable<any> {
    return this.http.put(`${this.USERS_API}/${id}/password`, passwordData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  // ================ STATISTICS & ANALYTICS ================

  /**
   * Get comprehensive system statistics for admin dashboard
   */
  getSystemStatistics(): Observable<AdminStatistics> {
    // Combine multiple data sources into single observable
    return combineLatest([
      this.getAllRequests(),
      this.getAllUsers(),
      this.companyService.getAllCompanies()
    ]).pipe(
      // Transform combined data into statistics
      map(([requests, users, companies]) => {
        return this.calculateSystemStatistics(requests, users, companies);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get user statistics
   */
  getUserStatistics(): Observable<UserStatistics> {
    return this.getAllUsers().pipe(
      // Calculate stats from user array
      map(users => this.calculateUserStatistics(users)),
      catchError(this.handleError)
    );
  }

  /**
   * Get all GDPR requests for admin analysis
   */
  getAllRequests(): Observable<GDPRRequest[]> {
    return this.requestService.getAllRequests();
  }

  /**
   * Get requests by user type (individual users vs company users)
   */
  getRequestsByUserType(): Observable<{userRequests: GDPRRequest[], companyRequests: GDPRRequest[]}> {
    return this.getAllRequests().pipe(
      map(requests => {
        // Filter requests by type
        const userRequests = requests.filter(req => req.user && !req.companyId);
        const companyRequests = requests.filter(req => req.companyId);
        return { userRequests, companyRequests };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get recent system activities for admin dashboard
   */
  getRecentActivities(limit: number = 10): Observable<SystemActivity[]> {
    // This would typically come from an activity log endpoint
    // For now, we'll create activities based on recent requests
    return this.requestService.getRecentRequestsAdmin().pipe(
      map(requests => {
        // Transform requests into activity objects
        return requests.slice(0, limit).map((request, index) => ({
          id: index,
          title: `GDPR Request #${request.id}`,
          description: `${request.requestType} request ${request.status.toLowerCase()}`,
          type: request.requestType,
          action: request.status.toLowerCase(),
          entityType: request.companyId ? 'company' : 'user' as 'user' | 'company',
          entityId: request.id,
          timestamp: request.updatedAt || request.createdAt,
          userId: request.userId
        }));
      }),
      catchError(this.handleError)
    );
  }

  // ================ SYSTEM MANAGEMENT ================

  /**
   * Export system data for analysis
   */
  exportSystemData(): Observable<any[]> {
    return combineLatest([
      this.getAllRequests(),
      this.getAllUsers(),
      this.companyService.getAllCompanies()
    ]).pipe(
      map(([requests, users, companies]) => {
        // Flatten all data types into single exportable array
        return [
          // Map requests to export format
          ...requests.map(req => ({
            type: 'request',
            id: req.id,
            requestType: req.requestType,
            status: req.status,
            createdAt: req.createdAt,
            userId: req.userId,
            companyId: req.companyId
          })),
          // Map users to export format
          ...users.map(user => ({
            type: 'user',
            id: user.idUser,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role?.roleName,
            active: user.active
          })),
          // Map companies to export format
          ...companies.map(company => ({
            type: 'company',
            id: company.idCompany,
            name: company.companyName,
            email: company.email
          }))
        ];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Search users by multiple criteria
   */
  searchUsers(criteria: {
    email?: string;
    name?: string;
    role?: string;
    active?: boolean;
  }): Observable<User[]> {
    return this.getAllUsers().pipe(
      map(users => {
        // Apply client-side filtering
        return users.filter(user => {
          // Email filter - case insensitive
          if (criteria.email && !user.email.toLowerCase().includes(criteria.email.toLowerCase())) {
            return false;
          }
          // Name filter - search full name
          if (criteria.name) {
            const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
            if (!fullName.includes(criteria.name.toLowerCase())) {
              return false;
            }
          }
          // Role filter - exact match
          if (criteria.role && user.role?.roleName !== criteria.role) {
            return false;
          }
          // Active status filter
          if (criteria.active !== undefined && user.active !== criteria.active) {
            return false;
          }
          return true;
        });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Batch operations on users
   */
  batchUpdateUsers(userIds: number[], updateData: Partial<UpdateUserDTO>): Observable<User[]> {
    // Create multiple update observables
    const updateObservables = userIds.map(id => this.updateUser(id, updateData));
    // Execute all updates in parallel
    return forkJoin(updateObservables);
  }

  /**
   * Batch deactivate users
   */
  batchDeactivateUsers(userIds: number[]): Observable<User[]> {
    const deactivateObservables = userIds.map(id => this.deactivateUser(id));
    return forkJoin(deactivateObservables);
  }

  // ================ UTILITY METHODS ================

  /**
   * Calculate comprehensive system statistics
   */
  private calculateSystemStatistics(requests: GDPRRequest[], users: User[], companies: Company[]): AdminStatistics {
    // Separate user and company requests
    const userRequests = requests.filter(req => req.user && !req.companyId);
    const companyRequests = requests.filter(req => req.companyId);

    return {
      userRequests: this.calculateRequestStats(userRequests),
      companyRequests: this.calculateRequestStats(companyRequests),
      users: this.calculateUserStats(users),
      companies: {
        total: companies.length
      }
    };
  }

  /**
   * Calculate request statistics
   */
  private calculateRequestStats(requests: GDPRRequest[]) {
    const stats = {
      total: requests.length,
      pending: 0,
      completed: 0,
      rejected: 0,
      inProgress: 0
    };

    // Count requests by status
    requests.forEach(request => {
      const status = request.status.toLowerCase();
      switch (status) {
        case 'pending':
        case 'en_attente':
          stats.pending++;
          break;
        case 'completed':
        case 'termine':
        case 'approved':
        case 'processed':
          stats.completed++;
          break;
        case 'rejected':
        case 'refuse':
          stats.rejected++;
          break;
        case 'in_progress':
        case 'en_cours':
        case 'processing':
          stats.inProgress++;
          break;
      }
    });

    return stats;
  }

  /**
   * Calculate user statistics
   */
  private calculateUserStats(users: User[]) {
    const stats = {
      total: users.length,
      active: 0,
      inactive: 0,
      admins: 0,
      managers: 0,
      clients: 0
    };

    // Process each user
    users.forEach(user => {
      // Count active/inactive
      if (user.active) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Count by role
      const role = user.role?.roleName?.toLowerCase();
      switch (role) {
        case 'admin':
          stats.admins++;
          break;
        case 'gerant':
        case 'manager':
          stats.managers++;
          break;
        case 'client':
        case 'user':
          stats.clients++;
          break;
      }
    });

    return stats;
  }

  /**
   * Calculate user statistics only
   */
  private calculateUserStatistics(users: User[]): UserStatistics {
    const usersByRole = {
      admins: 0,
      managers: 0,
      clients: 0
    };

    let activeUsers = 0;
    let inactiveUsers = 0;

    // Single pass through users array
    users.forEach(user => {
      if (user.active) {
        activeUsers++;
      } else {
        inactiveUsers++;
      }

      const role = user.role?.roleName?.toLowerCase();
      switch (role) {
        case 'admin':
          usersByRole.admins++;
          break;
        case 'gerant':
        case 'manager':
          usersByRole.managers++;
          break;
        case 'client':
        case 'user':
          usersByRole.clients++;
          break;
      }
    });

    return {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      usersByRole
    };
  }

  // ================ PRIVATE HELPER METHODS ================

  /**
   * Get HTTP options with authentication header
   */
  private getAuthHttpOptions(): { headers: HttpHeaders } {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // JWT Bearer authentication
      })
    };
  }

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    // Check for browser environment (SSR compatibility)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gdpr_auth_token');
    }
    return null;
  }

  /**
   * HTTP error handler
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized access. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 409:
          errorMessage = 'Resource already exists.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          // Use server error message if available
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    // Log error for debugging
    console.error('AdminService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}