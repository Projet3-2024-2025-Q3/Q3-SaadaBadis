// src/app/components/forgot-password/forgot-password.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, ForgotPasswordRequest } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // Form data properties
  email: string = '';

  // UI state properties
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  resendCooldown: number = 0;

  // Subject for component cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }

    // Prepare forgot password data
    const forgotPasswordData: ForgotPasswordRequest = {
      email: this.email.trim().toLowerCase()
    };

    // Start loading state
    this.isLoading = true;

    // Call forgot password service
    this.authService.forgotPassword(forgotPasswordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Show success message
          this.successMessage = 'Password reset email sent successfully!';
          
          // Start resend cooldown
          this.startResendCooldown();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Failed to send reset email. Please try again.';
          
          console.error('Forgot password error:', this.errorMessage);
        }
      });
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Resend password reset email
   */
  resendEmail(): void {
    if (this.resendCooldown > 0) {
      return;
    }

    this.onSubmit();
  }

  /**
   * Handle input changes to clear messages
   */
  onInputChange(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
    // Don't clear success message on input change to maintain UX
  }

  /**
   * Validate form data
   */
  private validateForm(): boolean {
    // Check required fields
    if (!this.email.trim()) {
      this.errorMessage = 'Email address is required';
      return false;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    return true;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Start cooldown timer for resend button
   */
  private startResendCooldown(): void {
    this.resendCooldown = 60; // 60 seconds cooldown
    
    const countdown$ = interval(1000).pipe(
      takeUntil(this.destroy$)
    );

    countdown$.subscribe(() => {
      this.resendCooldown--;
      
      if (this.resendCooldown <= 0) {
        this.resendCooldown = 0;
      }
    });
  }

  /**
   * Check if form is valid for submission
   */
  isFormValid(): boolean {
    return !!(
      this.email.trim() &&
      this.isValidEmail(this.email)
    );
  }

  /**
   * Get instructions text based on current state
   */
  getInstructionsText(): string {
    if (this.successMessage) {
      return 'Check your email for the reset link';
    }
    return 'Enter your email address and we\'ll send you a link to reset your password.';
  }

  /**
   * Handle Enter key press in form fields
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.successMessage) {
      this.onSubmit();
    }
  }

  /**
   * Development helper method to pre-fill with test email
   */
  fillTestEmail(): void {
    this.email = 'test@gdpr.com';
  }
}