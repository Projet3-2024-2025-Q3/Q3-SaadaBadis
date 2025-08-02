// src/app/components/dashboard/dashboard.component.ts
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

// Components
import { ClientNavbarComponent } from '../navbar/navbar.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';

// Interfaces
interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  dataDownloads: number;
}

interface RequestItem {
  id: string;
  title: string;
  type: 'data-access' | 'data-deletion' | 'data-portability' | 'data-correction';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  createdAt: Date;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  type: 'request-created' | 'request-updated' | 'data-downloaded' | 'profile-updated';
  timestamp: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ClientNavbarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // User data
  currentUser: UserInfo | null = null;
  
  // Dashboard data
  dashboardStats: DashboardStats = {
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    dataDownloads: 0
  };

  recentRequests: RequestItem[] = [];
  recentActivities: ActivityItem[] = [];

  // UI state
  isLoading: boolean = true;

  // Subject for component cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        }
      });

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get user's first name for welcome message
   */
  getUserFirstName(): string {
    if (!this.currentUser) return 'User';
    
    const firstName = this.currentUser.firstname;
    if (firstName) {
      return firstName;
    }
    
    // Fallback to email username
    return this.currentUser.email.split('@')[0];
  }

  /**
   * Load dashboard data
   */
  private loadDashboardData(): void {
    this.isLoading = true;

    // Simulate API call - replace with real service calls
    setTimeout(() => {
      this.loadStats();
      this.loadRecentRequests();
      this.loadRecentActivities();
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Load dashboard statistics
   */
  private loadStats(): void {
    // Simulate API call - replace with real service
    this.dashboardStats = {
      totalRequests: 12,
      pendingRequests: 3,
      completedRequests: 8,
      dataDownloads: 5
    };
  }

  /**
   * Load recent requests
   */
  private loadRecentRequests(): void {
    // Simulate API call - replace with real service
    this.recentRequests = [
      {
        id: '1',
        title: 'Access to Personal Data',
        type: 'data-access',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        id: '2',
        title: 'Delete My Account Data',
        type: 'data-deletion',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: '3',
        title: 'Export Data for Transfer',
        type: 'data-portability',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      }
    ];
  }

  /**
   * Load recent activities
   */
  private loadRecentActivities(): void {
    // Simulate API call - replace with real service
    this.recentActivities = [
      {
        id: '1',
        title: 'Request Completed',
        description: 'Your data access request has been processed',
        type: 'request-updated',
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: '2',
        title: 'New Request Created',
        description: 'Data deletion request submitted for review',
        type: 'request-created',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '3',
        title: 'Data Downloaded',
        description: 'Personal data export downloaded successfully',
        type: 'data-downloaded',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];
  }

  /**
   * Navigation methods
   */
  createNewRequest(): void {
    this.router.navigate(['/create-request']);
  }

  viewAllRequests(): void {
    this.router.navigate(['/my-requests']);
  }

  viewRequestDetails(requestId: string): void {
    this.router.navigate(['/my-requests', requestId]);
  }

  /**
   * Quick action methods for specific request types
   */
  createDataAccessRequest(): void {
    this.router.navigate(['/create-request'], { 
      queryParams: { type: 'data-access' } 
    });
  }

  createDataDeletionRequest(): void {
    this.router.navigate(['/create-request'], { 
      queryParams: { type: 'data-deletion' } 
    });
  }

  createDataPortabilityRequest(): void {
    this.router.navigate(['/create-request'], { 
      queryParams: { type: 'data-portability' } 
    });
  }

  createDataCorrectionRequest(): void {
    this.router.navigate(['/create-request'], { 
      queryParams: { type: 'data-correction' } 
    });
  }

  /**
   * Utility methods for UI
   */
  getRequestIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'data-access': 'visibility',
      'data-deletion': 'delete_outline',
      'data-portability': 'import_export',
      'data-correction': 'edit'
    };
    return iconMap[type] || 'assignment';
  }

  getRequestIconClass(type: string): string {
    return `request-icon ${type}`;
  }

  getStatusClass(status: string): string {
    return `status-badge ${status}`;
  }

  getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'request-created': 'add_circle_outline',
      'request-updated': 'update',
      'data-downloaded': 'download',
      'profile-updated': 'person'
    };
    return iconMap[type] || 'info';
  }

  getActivityIconClass(type: string): string {
    return `activity-icon ${type}`;
  }

  /**
   * Date formatting methods
   */
  formatDate(date: Date): string {
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

  formatDateTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  /**
   * Handle stat card clicks
   */
  onStatCardClick(statType: string): void {
    switch (statType) {
      case 'total':
      case 'pending':
      case 'completed':
        this.router.navigate(['/my-requests'], { 
          queryParams: { filter: statType } 
        });
        break;
      case 'downloads':
        this.router.navigate(['/my-requests'], { 
          queryParams: { tab: 'downloads' } 
        });
        break;
    }
  }

  /**
   * Development helper methods
   */
  isDevelopmentMode(): boolean {
    return !environment.production;
  }

  logDashboardData(): void {
    console.log('Dashboard Data:', {
      user: this.currentUser,
      stats: this.dashboardStats,
      requests: this.recentRequests,
      activities: this.recentActivities
    });
  }
}

// Environment import (add this at the top with other imports)
declare const environment: any;