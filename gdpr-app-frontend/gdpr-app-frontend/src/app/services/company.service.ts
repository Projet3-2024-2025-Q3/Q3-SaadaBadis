// src/app/services/company.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
export interface Company {
  idCompany: number;
  companyName: string;
  email: string;
}

export interface CreateCompanyDTO {
  companyName: string;
  email: string;
}

export interface CompanyStatistics {
  totalCompanies: number;
}

@Injectable({
  providedIn: 'root' // Singleton service available throughout the application
})
export class CompanyService {
  // API endpoint configuration
  private readonly API_URL = 'https://q3-saadabadis.onrender.com/api/companies';

  // Default HTTP headers for requests
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Get all companies
   */
  getAllCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.API_URL}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError) // Handle HTTP errors
      );
  }

  /**
   * Get company by ID
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.API_URL}/${id}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get company by email
   */
  getCompanyByEmail(email: string): Observable<Company> {
    return this.http.get<Company>(`${this.API_URL}/email/${email}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get company by name
   */
  getCompanyByName(name: string): Observable<Company> {
    return this.http.get<Company>(`${this.API_URL}/name/${name}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Create new company (Admin only)
   */
  createCompany(companyData: CreateCompanyDTO): Observable<Company> {
    return this.http.post<Company>(`${this.API_URL}`, companyData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update company (Admin only)
   */
  updateCompany(id: number, companyData: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.API_URL}/${id}`, companyData, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Delete company (Admin only)
   */
  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Search companies by name
   */
  searchCompaniesByName(name: string): Observable<Company[]> {
    // Use encodeURIComponent to handle special characters in search terms
    return this.http.get<Company[]>(`${this.API_URL}/search/name?name=${encodeURIComponent(name)}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Search companies by email
   */
  searchCompaniesByEmail(email: string): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.API_URL}/search/email?email=${encodeURIComponent(email)}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get companies with pagination
   */
  getCompaniesWithPagination(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get(`${this.API_URL}/paginated?page=${page}&size=${size}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get company statistics
   */
  getCompanyStatistics(): Observable<CompanyStatistics> {
    return this.http.get<CompanyStatistics>(`${this.API_URL}/statistics`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get all company names (for dropdowns)
   */
  getAllCompanyNames(): Observable<string[]> {
    // Optimized endpoint that returns only names for UI components
    return this.http.get<string[]>(`${this.API_URL}/names`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Check if company exists by email
   */
  existsByEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/exists/email/${encodeURIComponent(email)}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Check if company exists by name
   */
  existsByName(name: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/exists/name/${encodeURIComponent(name)}`, this.getAuthHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    // Regex pattern for email validation
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validate company name
   */
  isValidCompanyName(name: string): boolean {
    // Check for empty or null values
    if (!name || name.trim().length === 0) {
      return false;
    }
    const trimmed = name.trim();
    // Name must be between 2 and 100 characters
    return trimmed.length >= 2 && trimmed.length <= 100;
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
        'Authorization': `Bearer ${token}` // JWT Bearer token authentication
      })
    };
  }

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    // Check if running in browser environment (SSR compatibility)
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
      // Server-side error - handle specific HTTP status codes
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized access. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Company not found.';
          break;
        case 409:
          errorMessage = 'Company already exists.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          // Use server-provided error message if available
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    // Log error for debugging
    console.error('CompanyService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}