// Import core Angular modules for component functionality
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Provides common directives like *ngIf, *ngFor
import { FormsModule } from '@angular/forms'; // Enables template-driven forms with ngModel
import { Router } from '@angular/router'; // For programmatic navigation

// Angular Material Imports - UI component library
import { MatCardModule } from '@angular/material/card'; // Card container component
import { MatFormFieldModule } from '@angular/material/form-field'; // Form field wrapper
import { MatInputModule } from '@angular/material/input'; // Input field styling
import { MatButtonModule } from '@angular/material/button'; // Button components
import { MatIconModule } from '@angular/material/icon'; // Icon system
import { MatCheckboxModule } from '@angular/material/checkbox'; // Checkbox component
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Loading spinner
import { MatDividerModule } from '@angular/material/divider'; // Visual divider line
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar'; // Toast notifications

// Custom services
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
 selector: 'app-login', // HTML tag to use this component
 standalone: true, // Modern Angular 17+ approach - no need for NgModule
 imports: [
   // List all dependencies this standalone component needs
   CommonModule,
   FormsModule,
   MatCardModule,
   MatFormFieldModule,
   MatInputModule,
   MatButtonModule,
   MatIconModule,
   MatCheckboxModule,
   MatProgressSpinnerModule,
   MatDividerModule,
   MatSnackBarModule
 ],
 templateUrl: './login.component.html', // External template file
 styleUrls: ['./login.component.css'] // External stylesheet
})
export class LoginComponent {
 
 // ========== FORM DATA PROPERTIES ==========
 email: string = ''; // Two-way bound to email input field
 password: string = ''; // Two-way bound to password field
 rememberMe: boolean = false; // Checkbox state for persistent login
 showPassword: boolean = false; // Toggle password visibility
 
 // ========== UI STATE PROPERTIES ==========
 errorMessage: string = ''; // Global error message display
 isLoading: boolean = false; // Loading state for async operations

 constructor(
   private router: Router, // Inject router for navigation
   private authService: AuthService, // Inject custom auth service
   private snackBar: MatSnackBar // Inject Material snackbar service
 ) {
   // Guard against double login - redirect if already authenticated
   if (this.authService.isAuthenticated()) {
     this.redirectToDashboard();
   }
 }

 /**
  * Main form submission handler
  * Called when user clicks login button or presses Enter
  */
 onSubmit(): void {
   // Prevent multiple simultaneous submissions
   if (this.isLoading) return;

   // Client-side validation before API call
   if (!this.isFormValid()) {
     this.showError('Please fill in all fields correctly');
     return;
   }

   // Set loading state and clear previous errors
   this.isLoading = true;
   this.errorMessage = '';

   // Create request object with sanitized data
   const loginData: LoginRequest = {
     email: this.email.trim(), // Remove whitespace
     password: this.password
   };

   console.log('Login attempt for:', loginData.email);

   // Make HTTP request via AuthService
   this.authService.login(loginData).subscribe({
     // Success callback
     next: (response) => {
       console.log('Login successful:', response);
       this.showSuccess(`Welcome ${response.firstname}!`);
       
       // Handle "Remember Me" functionality
       if (this.rememberMe) {
         // TODO: Implement token persistence logic
         console.log('Remember me option activated');
       }

       // Navigate based on user role
       this.redirectBasedOnRole(response.role);
     },
     // Error callback
     error: (error) => {
       console.error('Login error:', error);
       this.isLoading = false; // Reset loading state
       this.errorMessage = error.message || 'Login error';
       this.showError(this.errorMessage);
     },
     // Completion callback (runs after success or error)
     complete: () => {
       this.isLoading = false;
     }
   });
 }

 /**
  * Handler for forgot password link
  * Navigate to forgot password page
  */
 onForgotPassword(): void {
  this.router.navigate(['/forgot-password']);
 }

 /**
  * Handler for registration link
  * Navigate to signup page
  */
 onRegister(event?: Event): void {
   // Prevent form submission if called from button
   if (event) {
     event.preventDefault();
     event.stopPropagation();
   }
   
   console.log('Redirecting to signup page');
   this.router.navigate(['/signup']);
 }

 /**
  * Toggle password field visibility
  * Changes input type between 'password' and 'text'
  */
 togglePasswordVisibility(): void {
   this.showPassword = !this.showPassword;
 }

 /**
  * Utility method to clear error messages
  */
 clearError(): void {
   this.errorMessage = '';
 }

 /**
  * Handle Enter key press in form fields
  * Triggers form submission
  */
 onKeyPress(event: KeyboardEvent): void {
   if (event.key === 'Enter') {
     this.onSubmit();
   }
 }

 // ========== CLIENT-SIDE VALIDATION METHODS ==========

 /**
  * Validate email format using regex
  * Basic email pattern validation
  */
 isEmailValid(): boolean {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(this.email.trim());
 }

 /**
  * Validate password length
  * Minimum 6 characters required
  */
 isPasswordValid(): boolean {
   return this.password.length >= 6;
 }

 /**
  * Overall form validation
  * Combines all validation rules
  */
 isFormValid(): boolean {
   return this.isEmailValid() && this.isPasswordValid();
 }

 /**
  * Development helper method
  * Pre-fills form with test credentials
  */
 fillDemoCredentials(): void {
   this.email = 'admin@gdpr.com';
   this.password = 'admin123';
 }

 // ========== PRIVATE HELPER METHODS ==========

 /**
  * Navigate user to appropriate dashboard based on their role
  * Uses setTimeout to let user see success message
  */
 private redirectBasedOnRole(role: string): void {
   // Delay navigation to show success message
   setTimeout(() => {
     switch (role) {
       case 'ADMIN':
         this.router.navigate(['/admin/dashboard']);
         break;
       case 'GERANT': // Manager role
         this.router.navigate(['/manager-dashboard']);
         break;
       case 'CLIENT':
       default:
         this.router.navigate(['/dashboard']); // Client dashboard
     }
   }, 1500); // 1.5 second delay
 }

 /**
  * Default redirect for already authenticated users
  * Checks current user and redirects accordingly
  */
 private redirectToDashboard(): void {
   const user = this.authService.getCurrentUser();
   if (user) {
     this.redirectBasedOnRole(user.role);
   } else {
     this.router.navigate(['/dashboard']);
   }
 }

 /**
  * Display success notification using Material Snackbar
  * Green styling with auto-dismiss
  */
 private showSuccess(message: string): void {
   this.snackBar.open(message, 'Close', {
     duration: 3000, // Auto-close after 3 seconds
     panelClass: ['success-snackbar'], // CSS class for styling
     horizontalPosition: 'center',
     verticalPosition: 'top'
   });
 }

 /**
  * Display error notification using Material Snackbar
  * Red styling with longer duration
  */
 private showError(message: string): void {
   this.snackBar.open(message, 'Close', {
     duration: 5000, // Longer duration for errors
     panelClass: ['error-snackbar'],
     horizontalPosition: 'center',
     verticalPosition: 'top'
   });
 }

 /**
  * Display info notification using Material Snackbar
  * Blue styling for informational messages
  */
 private showInfo(message: string): void {
   this.snackBar.open(message, 'Close', {
     duration: 3000,
     panelClass: ['info-snackbar'],
     horizontalPosition: 'center',
     verticalPosition: 'top'
   });
 }
}