import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interfaces for GDPR requests
export interface GDPRRequest {
  id: number;
  requestType: string;
  requestContent: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  companyId: number;
  user?: {
    idUser: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  company?: {
    companyName: string;
    idCompany: number;
    
  };
}

export interface CreateGDPRRequestDTO {
  requestType: string;
  requestContent: string;
  userId: number;
  companyId: number;
}

export interface UpdateStatusDTO {
  status: string;
}

export interface UpdateContentDTO {
  content: string;
}

export interface RequestStatistics {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  inProgressRequests: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private readonly API_URL = 'https://q3-saadabadis.onrender.com/api/gdpr-requests';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Get current user's GDPR requests
   */
  getMyRequests(): Observable<GDPRRequest[]> {
    return this.http.get<GDPRRequest[]>(`${this.API_URL}/my-requests`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get current user's requests by status
   */
  getMyRequestsByStatus(status: string): Observable<GDPRRequest[]> {
    return this.http.get<GDPRRequest[]>(`${this.API_URL}/my-requests/status/${status}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get user's request statistics for dashboard
   */
  getMyRequestStatistics(): Observable<RequestStatistics> {
    return this.getMyRequests().pipe(
      map(requests => this.calculateStatistics(requests)),
      catchError(this.handleError)
    );
  }

  /**
   * Get GDPR request by ID
   */
  getRequestById(id: number): Observable<GDPRRequest> {
    return this.http.get<GDPRRequest>(`${this.API_URL}/${id}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Create new GDPR request
   */
  createRequest(requestData: CreateGDPRRequestDTO): Observable<GDPRRequest> {
    return this.http.post<GDPRRequest>(`${this.API_URL}`, requestData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update request content (user's own pending requests)
   */
  updateRequestContent(id: number, content: string): Observable<GDPRRequest> {
    const updateData: UpdateContentDTO = { content };
    return this.http.put<GDPRRequest>(`${this.API_URL}/${id}/content`, updateData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Delete GDPR request
   */
  deleteRequest(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get valid request types
   */
  getValidRequestTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/valid-types`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Validate request type
   */
  validateRequestType(requestType: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/validate/type/${requestType}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get recent requests (for activity feed)
   */
  getRecentRequests(limit: number = 5): Observable<GDPRRequest[]> {
    return this.getMyRequests().pipe(
      map(requests => {
        // Sort by creation date (most recent first) and limit
        return requests
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if user can access request
   */
  canAccessRequest(requestId: number): Observable<boolean> {
    return this.getRequestById(requestId).pipe(
      map(request => !!request), // If we can get the request, user has access
      catchError(() => {
        return throwError(() => new Error('Access denied'));
      })
    );
  }

  // ================ UTILITY METHODS ================

  /**
   * Calculate statistics from requests array
   */
  private calculateStatistics(requests: GDPRRequest[]): RequestStatistics {
    const stats: RequestStatistics = {
      totalRequests: requests.length,
      pendingRequests: 0,
      completedRequests: 0,
      rejectedRequests: 0,
      inProgressRequests: 0
    };

    requests.forEach(request => {
      const status = request.status.toLowerCase();
      switch (status) {
        case 'pending':
        case 'en_attente':
          stats.pendingRequests++;
          break;
        case 'completed':
        case 'termine':
        case 'approved':
          stats.completedRequests++;
          break;
        case 'rejected':
        case 'refuse':
          stats.rejectedRequests++;
          break;
        case 'in_progress':
        case 'en_cours':
        case 'processing':
          stats.inProgressRequests++;
          break;
      }
    });

    return stats;
  }

  /**
   * Get request type display name
   */
  getRequestTypeDisplayName(requestType: string): string {
    const typeMap: { [key: string]: string } = {
      'ACCESS': 'Data Access',
      'DELETION': 'Data Deletion',
      'PORTABILITY': 'Data Portability',
      'RECTIFICATION': 'Data Correction',
      'data-access': 'Data Access',
      'data-deletion': 'Data Deletion',
      'data-portability': 'Data Portability',
      'data-correction': 'Data Correction'
    };
    
    return typeMap[requestType] || requestType;
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending',
      'EN_ATTENTE': 'Pending',
      'COMPLETED': 'Completed',
      'TERMINE': 'Completed',
      'REJECTED': 'Rejected',
      'REFUSE': 'Rejected',
      'IN_PROGRESS': 'In Progress',
      'EN_COURS': 'In Progress',
      'pending': 'Pending',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'in_progress': 'In Progress'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Get status color class for UI
   */
  getStatusColorClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
      case 'en_attente':
        return 'status-pending';
      case 'completed':
      case 'termine':
      case 'approved':
        return 'status-completed';
      case 'rejected':
      case 'refuse':
        return 'status-rejected';
      case 'in_progress':
      case 'en_cours':
      case 'processing':
        return 'status-in-progress';
      default:
        return 'status-default';
    }
  }
  // Ajouter ces méthodes dans la classe RequestService

/**
 * Update request status (Manager/Admin only)
 * Used to validate, reject, or change status of a GDPR request
 */
updateRequestStatus(id: number, status: string): Observable<GDPRRequest> {
  const updateData: UpdateStatusDTO = { status };
  return this.http.put<GDPRRequest>(`${this.API_URL}/${id}/status`, updateData, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Validate a GDPR request (sets status to COMPLETED/APPROVED)
 * Manager/Admin only
 */
validateRequest(id: number): Observable<GDPRRequest> {
  return this.updateRequestStatus(id, 'PROCESSED');
}

/**
 * Approve a GDPR request (alternative to validate)
 * Manager/Admin only
 */
approveRequest(id: number): Observable<GDPRRequest> {
  return this.updateRequestStatus(id, 'APPROVED');
}

/**
 * Reject a GDPR request
 * Manager/Admin only
 */
rejectRequest(id: number): Observable<GDPRRequest> {
  return this.updateRequestStatus(id, 'REJECTED');
}

/**
 * Mark request as in progress
 * Manager/Admin only
 */
markRequestInProgress(id: number): Observable<GDPRRequest> {
  return this.updateRequestStatus(id, 'IN_PROGRESS');
}

/**
 * Get all GDPR requests (Admin only)
 */
getAllRequests(): Observable<GDPRRequest[]> {
  return this.http.get<GDPRRequest[]>(`${this.API_URL}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get company's GDPR requests (Manager/Admin)
 */
getCompanyRequests(companyId: number): Observable<GDPRRequest[]> {
  return this.http.get<GDPRRequest[]>(`${this.API_URL}/company/${companyId}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get company's pending requests (Manager/Admin)
 */
getCompanyPendingRequests(companyId: number): Observable<GDPRRequest[]> {
  return this.http.get<GDPRRequest[]>(`${this.API_URL}/company/${companyId}/pending`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get requests by status (Manager/Admin)
 */
getRequestsByStatus(status: string): Observable<GDPRRequest[]> {
  return this.http.get<GDPRRequest[]>(`${this.API_URL}/status/${status}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get requests by type (Manager/Admin)
 */
getRequestsByType(requestType: string): Observable<GDPRRequest[]> {
  return this.http.get<GDPRRequest[]>(`${this.API_URL}/type/${requestType}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get requests between dates (Manager/Admin)
 */
getRequestsBetweenDates(startDate: Date, endDate: Date): Observable<GDPRRequest[]> {
  const params = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
  
  return this.http.get<GDPRRequest[]>(`${this.API_URL}/date-range`, {
    ...this.getAuthHttpOptions(),
    params
  }).pipe(
    catchError(this.handleError)
  );
}

/**
 * Get recent requests for admin/manager dashboard
 * Different from user's recent requests
 */
getRecentRequestsAdmin(): Observable<GDPRRequest[]> {
  return this.http.get<GDPRRequest[]>(`${this.API_URL}/recent`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get request count by status (Manager/Admin)
 */
countRequestsByStatus(status: string): Observable<number> {
  return this.http.get<number>(`${this.API_URL}/count/status/${status}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get request count by company (Manager/Admin)
 */
countRequestsByCompany(companyId: number): Observable<number> {
  return this.http.get<number>(`${this.API_URL}/count/company/${companyId}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get comprehensive GDPR request statistics (Manager/Admin)
 */
getGDPRRequestStatistics(): Observable<any> {
  return this.http.get<any>(`${this.API_URL}/statistics`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Get valid statuses (Manager/Admin)
 */
getValidStatuses(): Observable<string[]> {
  return this.http.get<string[]>(`${this.API_URL}/valid-statuses`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Validate status (Manager/Admin)
 */
validateStatus(status: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.API_URL}/validate/status/${status}`, this.getAuthHttpOptions())
    .pipe(
      catchError(this.handleError)
    );
}

/**
 * Batch validate multiple requests
 * Utility method for validating multiple requests at once
 */
batchValidateRequests(requestIds: number[]): Observable<GDPRRequest[]> {
  const updateObservables = requestIds.map(id => this.validateRequest(id));
  return forkJoin(updateObservables);
}

/**
 * Batch update status for multiple requests
 * Utility method for updating multiple request statuses at once
 */
batchUpdateRequestStatus(requestIds: number[], status: string): Observable<GDPRRequest[]> {
  const updateObservables = requestIds.map(id => this.updateRequestStatus(id, status));
  return forkJoin(updateObservables);
}

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
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
        'Authorization': `Bearer ${token}`
      })
    };
  }

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
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
          errorMessage = 'Request not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    console.error('RequestService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}