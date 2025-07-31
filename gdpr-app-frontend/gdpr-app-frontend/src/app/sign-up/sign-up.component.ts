import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, RegisterRequest } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {
  // Form data properties
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  company: string = '';
  role: string = '';
  password: string = '';
  confirmPassword: string = '';
  agreeTerms: boolean = false;
  newsletterOptIn: boolean = false;

  // UI state properties
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  errorMessage: string = '';

  // Role options for select dropdown
  roleOptions = [
    { value: 'dpo', label: 'Data Protection Officer' },
    { value: 'legal', label: 'Legal Counsel' },
    { value: 'compliance', label: 'Compliance Manager' },
    { value: 'it', label: 'IT Manager' },
    { value: 'security', label: 'Security Officer' },
    { value: 'other', label: 'Other' }
  ];

  // Subject for component cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated
    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Clear previous error message
    this.errorMessage = '';

    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }

    // Check if passwords match
    if (!this.passwordsMatch()) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    // Check if terms are agreed
    if (!this.agreeTerms) {
      this.errorMessage = 'You must agree to the Terms of Service and Privacy Policy';
      return;
    }

    // Prepare registration data
    const registerData: RegisterRequest = {
      firstname: this.firstName.trim(),
      lastname: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      // Map role string to roleId if needed by your backend
      roleId: this.getRoleId(this.role)
    };

    // Start loading state
    this.isLoading = true;

    // Call registration service
    this.authService.register(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Show success message
          this.snackBar.open(
            'Account created successfully! Please check your email for verification.',
            'Close',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );

          // Navigate to login page after a short delay
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { email: this.email, registered: 'true' }
            });
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Registration failed. Please try again.';
          
          // Show error snackbar
          this.snackBar.open(
            this.errorMessage,
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Check if passwords match
   */
  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Show terms of service modal
   */
  showTerms(event: Event): void {
    event.preventDefault();
    // TODO: Implement terms modal or navigate to terms page
    this.snackBar.open('Terms of Service modal would open here', 'Close', { duration: 3000 });
  }

  /**
   * Show privacy policy modal
   */
  showPrivacy(event: Event): void {
    event.preventDefault();
    // TODO: Implement privacy modal or navigate to privacy page
    this.snackBar.open('Privacy Policy modal would open here', 'Close', { duration: 3000 });
  }

  /**
   * Validate form data
   */
  private validateForm(): boolean {
    // Check required fields
    if (!this.firstName.trim()) {
      this.errorMessage = 'First name is required';
      return false;
    }

    if (!this.lastName.trim()) {
      this.errorMessage = 'Last name is required';
      return false;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'Email address is required';
      return false;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    if (!this.company.trim()) {
      this.errorMessage = 'Company name is required';
      return false;
    }

    if (!this.role) {
      this.errorMessage = 'Please select your role';
      return false;
    }

    if (!this.password) {
      this.errorMessage = 'Password is required';
      return false;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return false;
    }

    if (!this.confirmPassword) {
      this.errorMessage = 'Please confirm your password';
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
   * Map role string to roleId (adapt based on your backend requirements)
   */
  private getRoleId(role: string): number | undefined {
    const roleMapping: { [key: string]: number } = {
      'dpo': 1,
      'legal': 2,
      'compliance': 3,
      'it': 4,
      'security': 5,
      'other': 6
    };
    
    return roleMapping[role];
  }

  /**
   * Get role label for display
   */
  getRoleLabel(roleValue: string): string {
    const role = this.roleOptions.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  /**
   * Check if form is valid for submission
   */
  isFormValid(): boolean {
    return !!(
      this.firstName.trim() &&
      this.lastName.trim() &&
      this.email.trim() &&
      this.isValidEmail(this.email) &&
      this.company.trim() &&
      this.role &&
      this.password &&
      this.password.length >= 8 &&
      this.confirmPassword &&
      this.passwordsMatch() &&
      this.agreeTerms
    );
  }

  /**
   * Handle input changes to clear error messages
   */
  onInputChange(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  /**
   * Handle password input to check strength (optional enhancement)
   */
  onPasswordChange(): void {
    this.onInputChange();
    // TODO: Add password strength indicator logic here if needed
  }

  /**
   * Handle confirm password input to check match
   */
  onConfirmPasswordChange(): void {
    this.onInputChange();
    // The template will handle the mismatch error display
  }
}