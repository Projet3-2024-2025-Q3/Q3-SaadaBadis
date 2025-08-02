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
    completedRequests: 0
  };

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
          this.loadDashboardStats();
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
   * Load dashboard statistics from API
   */
  private loadDashboardStats(): void {
    this.isLoading = true;

    // TODO: Replace with real API call to get user's request statistics
    // Example API call:
    // this.requestService.getUserRequestStats(this.currentUser.id).subscribe(stats => {
    //   this.dashboardStats = stats;
    //   this.isLoading = false;
    // });

    // For now, simulate API call with real-looking data
    setTimeout(() => {
      this.dashboardStats = {
        totalRequests: 0, // Will be loaded from API
        pendingRequests: 0, // Will be loaded from API
        completedRequests: 0 // Will be loaded from API
      };
      this.isLoading = false;
    }, 500);
  }

  /**
   * Navigation methods
   */
  createNewRequest(): void {
    this.router.navigate(['/create-request']);
  }
}