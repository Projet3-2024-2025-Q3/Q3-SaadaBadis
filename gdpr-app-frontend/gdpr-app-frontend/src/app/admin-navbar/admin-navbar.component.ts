// src/app/components/admin-navbar/admin-navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css']
})
export class AdminNavbarComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  pendingRequestsCount: number = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Load pending requests count for badge
    this.loadPendingRequestsCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Admin';
    
    if (this.currentUser.firstname) {
      return this.currentUser.firstname;
    }
    
    // Fallback to email username
    return this.currentUser.email.split('@')[0];
  }

  /**
   * Load pending requests count for notification badge
   */
  private loadPendingRequestsCount(): void {
    this.adminService.getSystemStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.pendingRequestsCount = stats.userRequests.pending + stats.companyRequests.pending;
        },
        error: (error) => {
          console.error('Error loading pending requests count:', error);
          this.pendingRequestsCount = 0;
        }
      });
  }

  /**
   * Navigation methods
   */
  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/manage-users']);
  }

  navigateToCompanies(): void {
    this.router.navigate(['/manage-companies']);
  }

  navigateToRequests(): void {
    this.router.navigate(['/myrequests-manager']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Check if current route is active
   */
  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  /**
   * Logout functionality
   */
  logout(): void {
    this.authService.logoutAndRedirect();
  }
}