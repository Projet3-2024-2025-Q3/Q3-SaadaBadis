// src/app/components/manager-navbar/manager-navbar.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { RequestService } from '../services/request.service';

// Interfaces
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  link?: string;
}

@Component({
  selector: 'app-manager-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './manager-navbar.component.html',
  styleUrls: ['./manager-navbar.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class ManagerNavbarComponent implements OnInit, OnDestroy {
  // User data
  currentUser: UserInfo | null = null;
  
  // UI state
  isMobile: boolean = false;
  mobileMenuOpen: boolean = false;
  
  // Notifications
  notifications: Notification[] = [];
  notificationCount: number = 0;
  pendingCount: number = 0;
  
  // Subject for cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private authService: AuthService,
    private requestService: RequestService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.checkScreenSize();
  }
  
  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
    
    // Load notifications
    this.loadNotifications();
    
    // Load pending requests count
    this.loadPendingCount();
    
    // Subscribe to real-time notifications if available
    this.subscribeToNotifications();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }
  
  /**
   * Check if screen is mobile size
   */
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }
  
  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
  
  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Manager';
    return this.currentUser.firstname || this.currentUser.email.split('@')[0];
  }
  
  /**
   * Get user full name
   */
  getUserFullName(): string {
    if (!this.currentUser) return 'Manager User';
    return `${this.currentUser.firstname} ${this.currentUser.lastname}`.trim() || 'Manager User';
  }
  
  /**
   * Get user email
   */
  getUserEmail(): string {
    return this.currentUser?.email || '';
  }
  
  /**
   * Load notifications
   */
  private loadNotifications(): void {
    // For now, we'll create mock notifications based on recent requests
    // In a real app, you'd have a separate notifications endpoint
    this.requestService.getRecentRequests(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.notifications = requests.map((req, index) => ({
            id: req.id,
            title: `Request #${req.id}`,
            message: `${this.requestService.getRequestTypeDisplayName(req.requestType)} - ${this.requestService.getStatusDisplayName(req.status)}`,
            type: this.getNotificationType(req.status),
            timestamp: new Date(req.updatedAt || req.createdAt),
            read: false,
            link: `/manager/requests/${req.id}`
          }));
          this.notificationCount = this.notifications.filter(n => !n.read).length;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
        }
      });
  }

  /**
   * Get notification type based on status
   */
  private getNotificationType(status: string): 'info' | 'warning' | 'error' | 'success' {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('approved')) {
      return 'success';
    } else if (statusLower.includes('rejected')) {
      return 'error';
    } else if (statusLower.includes('pending')) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Load pending requests count
   */
  private loadPendingCount(): void {
    this.requestService.getMyRequestsByStatus('PENDING')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.pendingCount = requests.length;
        },
        error: (error) => {
          console.error('Error loading pending count:', error);
        }
      });
  }
  
  /**
   * Subscribe to real-time notifications
   */
  private subscribeToNotifications(): void {
    // This would connect to a WebSocket or SSE for real-time updates
    // For now, we'll poll every 30 seconds
    setInterval(() => {
      this.loadNotifications();
      this.loadPendingCount();
    }, 30000);
  }
  
  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'info': 'info',
      'warning': 'warning',
      'error': 'error',
      'success': 'check_circle'
    };
    return icons[type] || 'notifications';
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
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }
  
  /**
   * Handle notification click
   */
  handleNotificationClick(notification: Notification): void {
    // Mark as read locally
    notification.read = true;
    this.notificationCount = this.notifications.filter(n => !n.read).length;
    
    // Navigate if link provided
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }
  
  /**
   * View all notifications
   */
  viewAllNotifications(): void {
    this.router.navigate(['/manager/notifications']);
  }
  
  /**
   * Open search dialog
   */
  openSearch(): void {
    // Open search dialog/modal
    // This would open a search component in a dialog
    console.log('Opening search...');
  }
  
  /**
   * Navigation methods
   */
  navigateToHome(): void {
    this.router.navigate(['/manager/dashboard']);
  }
  
  navigateToProfile(): void {
    this.router.navigate(['/change-password']);
  }
  
  navigateToAccountSettings(): void {
    this.router.navigate(['/manager/settings/account']);
  }
  
  navigateToActivityLog(): void {
    this.router.navigate(['/manager/activity']);
  }
  
  navigateToHelp(): void {
    this.router.navigate(['/help']);
  }
  
  /**
   * Logout
   */
  logout(): void {
    this.authService.logoutAndRedirect();
  }
}