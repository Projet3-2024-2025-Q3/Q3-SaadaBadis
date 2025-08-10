// src/app/components/manager-dashboard/manager-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { ManagerNavbarComponent } from '../manager-navbar/manager-navbar.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { RequestService, GDPRRequest, RequestStatistics } from '../services/request.service';

// Interfaces
interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  icon: string;
  timestamp: Date;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    ManagerNavbarComponent
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  // User data
  currentUser: UserInfo | null = null;

  // Dashboard data
  dashboardStats: DashboardStats = {
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  };

  recentActivities: Activity[] = [];

  // UI state
  isLoading: boolean = true;

  // Subject for component cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    public requestService: RequestService,  // public pour l'utiliser dans le template
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is manager
    if (!this.authService.isManager()) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get user's first name for welcome message
   */
  getUserFirstName(): string {
    if (!this.currentUser) return 'Manager';
    
    const firstName = this.currentUser.firstname;
    if (firstName) {
      return firstName;
    }
    
    // Fallback to email username
    return this.currentUser.email.split('@')[0];
  }

  /**
   * Load all dashboard data
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Load statistics
    this.loadDashboardStats();
    
    // Load recent activities
    this.loadRecentActivities();
  }

  /**
   * Load dashboard statistics
   */
  private loadDashboardStats(): void {
    // For manager, we'll need to get all requests (this might need an admin endpoint)
    // For now, using the available endpoint
    this.requestService.getMyRequestStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: RequestStatistics) => {
          this.dashboardStats = {
            totalRequests: stats.totalRequests,
            pendingRequests: stats.pendingRequests,
            completedRequests: stats.completedRequests
          };
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Load recent activities
   */
  private loadRecentActivities(): void {
    // Convert recent requests to activities format
    this.requestService.getRecentRequests(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.recentActivities = requests.map((req, index) => ({
            id: index,
            title: `Request #${req.id}`,
            description: `${this.requestService.getRequestTypeDisplayName(req.requestType)} - ${this.requestService.getStatusDisplayName(req.status)}`,
            icon: this.getActivityIcon(req.status),
            timestamp: new Date(req.updatedAt || req.createdAt)
          }));
        },
        error: (error) => {
          console.error('Error loading activities:', error);
          this.recentActivities = [];
        }
      });
  }

  /**
   * Get activity icon based on status
   */
  private getActivityIcon(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('approved')) {
      return 'check_circle';
    } else if (statusLower.includes('rejected')) {
      return 'cancel';
    } else if (statusLower.includes('progress')) {
      return 'pending';
    }
    return 'schedule';
  }

  /**
   * Get request type CSS class
   */
  getRequestTypeClass(type: string): string {
    const typeClasses: { [key: string]: string } = {
      'ACCESS': 'data-access',
      'DELETION': 'data-deletion',
      'PORTABILITY': 'data-portability',
      'RECTIFICATION': 'data-correction',
      'data-access': 'data-access',
      'data-deletion': 'data-deletion',
      'data-portability': 'data-portability',
      'data-correction': 'data-correction'
    };
    return typeClasses[type] || 'data-access';
  }

  /**
   * Get icon for request type
   */
  getRequestIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'ACCESS': 'visibility',
      'DELETION': 'delete',
      'PORTABILITY': 'import_export',
      'RECTIFICATION': 'edit',
      'data-access': 'visibility',
      'data-deletion': 'delete',
      'data-portability': 'import_export',
      'data-correction': 'edit'
    };
    return icons[type] || 'assignment';
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    return this.requestService.formatDate(date.toString());
  }

  /**
   * Format time ago
   */
  formatTimeAgo(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Navigation methods
   */
  viewAllRequests(): void {
    this.router.navigate(['/myrequests-manager']);
  }

  viewPendingRequests(): void {
    this.router.navigate(['/manager/requests'], { 
      queryParams: { status: 'pending' } 
    });
  }

  viewCompletedRequests(): void {
    this.router.navigate(['/manager/requests'], { 
      queryParams: { status: 'completed' } 
    });
  }

  viewRequestDetails(requestId: number): void {
    this.router.navigate(['/manager/requests', requestId]);
  }

  viewReports(): void {
    this.router.navigate(['/manager/reports']);
  }

  manageUsers(): void {
    this.router.navigate(['/manager/users']);
  }

  exportData(): void {
    // Create CSV export of requests
    this.requestService.getMyRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          // Convert to CSV
          const csvContent = this.convertToCSV(requests);
          
          // Create download link
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `gdpr-requests-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          console.log('Data exported successfully');
        },
        error: (error) => {
          console.error('Export failed:', error);
        }
      });
  }

  /**
   * Convert requests to CSV format
   */
  private convertToCSV(requests: GDPRRequest[]): string {
    const headers = ['ID', 'Type', 'Status', 'Created Date', 'Updated Date', 'Content'];
    const rows = requests.map(req => [
      req.id,
      this.requestService.getRequestTypeDisplayName(req.requestType),
      this.requestService.getStatusDisplayName(req.status),
      new Date(req.createdAt).toLocaleDateString(),
      new Date(req.updatedAt).toLocaleDateString(),
      `"${req.requestContent.replace(/"/g, '""')}"`
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}