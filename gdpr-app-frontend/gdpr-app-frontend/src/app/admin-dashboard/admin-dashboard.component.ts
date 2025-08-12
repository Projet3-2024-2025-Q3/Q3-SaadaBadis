// src/app/components/admin-dashboard/admin-dashboard.component.ts
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
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { AdminService, AdminStatistics } from '../services/admin.service';

// Interfaces
interface DashboardStats {
  totalUserRequests: number;
  totalCompanyRequests: number;
  pendingUserRequests: number;
  pendingCompanyRequests: number;
  completedUserRequests: number;
  completedCompanyRequests: number;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  icon: string;
  timestamp: Date;
  type: 'user' | 'company';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    AdminNavbarComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // User data
  currentUser: UserInfo | null = null;

  // Dashboard data
  dashboardStats: DashboardStats = {
    totalUserRequests: 0,
    totalCompanyRequests: 0,
    pendingUserRequests: 0,
    pendingCompanyRequests: 0,
    completedUserRequests: 0,
    completedCompanyRequests: 0
  };

  recentActivities: Activity[] = [];

  // UI state
  isLoading: boolean = true;

  // Subject for component cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    public adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
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
    if (!this.currentUser) return 'Administrator';
    
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
    this.adminService.getSystemStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: AdminStatistics) => {
          this.dashboardStats = {
            totalUserRequests: stats.userRequests.total,
            totalCompanyRequests: stats.companyRequests.total,
            pendingUserRequests: stats.userRequests.pending,
            pendingCompanyRequests: stats.companyRequests.pending,
            completedUserRequests: stats.userRequests.completed,
            completedCompanyRequests: stats.companyRequests.completed
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
    this.adminService.getRecentActivities(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities) => {
          this.recentActivities = activities.map((activity, index) => ({
            id: index,
            title: activity.title,
            description: activity.description,
            icon: this.getActivityIcon(activity.type, activity.action),
            timestamp: new Date(activity.timestamp),
            type: activity.entityType as 'user' | 'company'
          }));
        },
        error: (error) => {
          console.error('Error loading activities:', error);
          this.recentActivities = [];
        }
      });
  }

  /**
   * Get activity icon based on type and action
   */
  private getActivityIcon(type: string, action: string): string {
    if (action.includes('created')) {
      return 'add_circle';
    } else if (action.includes('completed')) {
      return 'check_circle';
    } else if (action.includes('rejected')) {
      return 'cancel';
    } else if (action.includes('updated')) {
      return 'edit';
    }
    return 'schedule';
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
  viewUserRequests(): void {
    this.router.navigate(['/admin/requests/users']);
  }

  viewCompanyRequests(): void {
    this.router.navigate(['/admin/requests/companies']);
  }

  viewAllUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  viewAllCompanies(): void {
    this.router.navigate(['/admin/companies']);
  }

  viewSystemReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  manageSystem(): void {
    this.router.navigate(['/admin/settings']);
  }

  exportSystemData(): void {
    this.adminService.exportSystemData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Convert to CSV
          const csvContent = this.convertToCSV(data);
          
          // Create download link
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `system-data-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          console.log('System data exported successfully');
        },
        error: (error) => {
          console.error('Export failed:', error);
        }
      });
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      })
    );
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}