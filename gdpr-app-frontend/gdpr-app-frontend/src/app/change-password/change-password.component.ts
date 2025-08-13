// src/app/components/change-password/change-password.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

// Components
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';
import { ManagerNavbarComponent } from '../manager-navbar/manager-navbar.component';
import { ClientNavbarComponent } from '../navbar/navbar.component';

// Services
import { AuthService, UserInfo, ChangePasswordRequest } from '../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    AdminNavbarComponent,
    ManagerNavbarComponent,
    ClientNavbarComponent
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  passwordForm!: FormGroup;
  currentUser: UserInfo | null = null;
  isSubmitting = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Role detection
  isAdmin = false;
  isManager = false;
  isClient = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get current user info
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateRoleFlags();
      });

    this.createForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update role detection flags
   */
  private updateRoleFlags(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isManager = this.authService.isManager();
    this.isClient = this.authService.isClient();
  }

  /**
   * Create reactive form with validation
   */
  private createForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom password strength validator
   */
  private passwordStrengthValidator(control: any) {
    if (!control.value) return null;
    
    const value = control.value;
    const hasNumber = /[0-9]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    let strength = 0;
    if (hasNumber) strength++;
    if (hasLower) strength++;
    if (hasUpper) strength++;
    if (hasSpecial) strength++;
    
    if (value.length >= 8 && strength >= 3) {
      return null; // Strong password
    }
    
    return { weakPassword: true };
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (!newPassword || !confirmPassword) return null;
    
    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Get form field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['weakPassword']) return 'Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters';
    
    // Form-level errors
    if (fieldName === 'confirmPassword' && this.passwordForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return 'Invalid value';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if form field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    const hasFieldError = !!(field && field.errors && field.touched);
    
    // Check for form-level password mismatch error
    if (fieldName === 'confirmPassword') {
      return hasFieldError || (this.passwordForm.errors?.['passwordMismatch'] && field?.touched);
    }
    
    return hasFieldError;
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  /**
   * Get password strength level
   */
  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (!password) return 0;
    
    const hasNumber = /[0-9]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (hasNumber) strength++;
    if (hasLower) strength++;
    if (hasUpper) strength++;
    if (hasSpecial) strength++;
    
    return Math.min(strength, 5);
  }

  /**
   * Get password strength text
   */
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return '';
    }
  }

  /**
   * Get password strength color class
   */
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return 'strength-very-weak';
      case 2: return 'strength-weak';
      case 3: return 'strength-fair';
      case 4: return 'strength-good';
      case 5: return 'strength-strong';
      default: return '';
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.passwordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const changePasswordData: ChangePasswordRequest = {
        oldPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };
      
      this.authService.changePassword(changePasswordData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.showSnackBar('Password changed successfully', 'success');
            this.passwordForm.reset();
            this.isSubmitting = false;
            
            // Redirect to appropriate dashboard after success
            setTimeout(() => {
              this.redirectToDashboard();
            }, 2000);
          },
          error: (error) => {
            console.error('Error changing password:', error);
            this.showSnackBar(error.message || 'Failed to change password', 'error');
            this.isSubmitting = false;
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Redirect to appropriate dashboard based on role
   */
  private redirectToDashboard(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin-dashboard']);
    } else if (this.isManager) {
      this.router.navigate(['/manager-dashboard']);
    } else if (this.isClient) {
      this.router.navigate(['/client-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.redirectToDashboard();
  }

  /**
   * Get theme class based on user role
   */
  getThemeClass(): string {
    if (this.isAdmin) return 'admin-theme';
    if (this.isManager) return 'manager-theme';
    if (this.isClient) return 'client-theme';
    return 'default-theme';
  }

  /**
   * Get header title based on role
   */
  getHeaderTitle(): string {
    if (this.isAdmin) return 'Admin - Change Password';
    if (this.isManager) return 'Manager - Change Password';
    if (this.isClient) return 'Client - Change Password';
    return 'Change Password';
  }

  /**
   * Get header subtitle based on role
   */
  getHeaderSubtitle(): string {
    return 'Update your account password for security';
  }

  /**
   * Show snackbar message
   */
  private showSnackBar(message: string, type: 'success' | 'error'): void {
    const config: any = {
      duration: type === 'success' ? 4000 : 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    };

    if (type === 'error') {
      config.panelClass = ['error-snackbar'];
    } else if (type === 'success') {
      config.panelClass = ['success-snackbar'];
    }

    this.snackBar.open(message, 'Close', config);
  }

  /**
   * Get user full name
   */
  getUserFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstname} ${this.currentUser.lastname}`.trim();
    }
    return 'User';
  }

  /**
   * Get character count for field
   */
  getCharacterCount(fieldName: string): number {
    const field = this.passwordForm.get(fieldName);
    return field?.value?.length || 0;
  }
}