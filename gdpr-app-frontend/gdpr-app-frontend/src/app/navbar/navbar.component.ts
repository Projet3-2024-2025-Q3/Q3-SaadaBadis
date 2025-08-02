// src/app/components/client-navbar/client-navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, UserInfo } from '../services/auth.service';

@Component({
  selector: 'app-client-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class ClientNavbarComponent implements OnInit, OnDestroy {
  // User data
  currentUser: UserInfo | null = null;
  
  // UI state
  isMobileMenuOpen: boolean = false;
  currentRoute: string = '';

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
      });

    // Track current route for active state
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Set initial route
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    
    const firstName = this.currentUser.firstname || '';
    const lastName = this.currentUser.lastname || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return this.currentUser.email.split('@')[0]; // Use email prefix as fallback
    }
  }

  /**
   * Check if route is active
   */
  isActiveRoute(route: string): boolean {
    if (route === '/dashboard') {
      return this.currentRoute === '/dashboard' || this.currentRoute === '/';
    }
    return this.currentRoute.startsWith(route);
  }

  /**
   * Navigate to route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Navigate to route and close mobile menu
   */
  navigateToMobile(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigate to profile page
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigate to profile page (mobile)
   */
  goToProfileMobile(): void {
    this.router.navigate(['/profile']);
    this.closeMobileMenu();
  }

  /**
   * Navigate to settings page
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Navigate to settings page (mobile)
   */
  goToSettingsMobile(): void {
    this.router.navigate(['/settings']);
    this.closeMobileMenu();
  }

  /**
   * Handle logout
   */
  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logoutAndRedirect();
    }
  }

  /**
   * Handle logout (mobile)
   */
  logoutMobile(): void {
    this.closeMobileMenu();
    setTimeout(() => {
      if (confirm('Are you sure you want to logout?')) {
        this.authService.logoutAndRedirect();
      }
    }, 300); // Small delay to let menu close animation finish
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    // Prevent body scroll when menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto';
  }

  /**
   * Handle window resize to close mobile menu on desktop
   */
  onWindowResize(): void {
    if (window.innerWidth > 768 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  /**
   * Get initials for avatar (alternative implementation)
   */
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstName = this.currentUser.firstname || '';
    const lastName = this.currentUser.lastname || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else {
      return this.currentUser.email.charAt(0).toUpperCase();
    }
  }

  /**
   * Check if user has specific permissions (for future use)
   */
  canAccessRoute(route: string): boolean {
    // Implement permission checking logic here
    // For now, all client routes are accessible
    return true;
  }

  /**
   * Get notification count (for future implementation)
   */
  getNotificationCount(): number {
    // TODO: Implement notification system
    return 0;
  }

  /**
   * Handle keyboard navigation
   */
  onKeydown(event: KeyboardEvent): void {
    // Close mobile menu on Escape key
    if (event.key === 'Escape' && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}