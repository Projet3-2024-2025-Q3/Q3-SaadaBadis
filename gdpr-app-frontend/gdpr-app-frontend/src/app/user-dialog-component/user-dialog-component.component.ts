// src/app/components/manage-users/user-form-dialog/user-form-dialog.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material Imports
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Types
import { User } from '../services/admin.service';

// Dialog Data Interface
export interface UserFormDialogData {
  user?: User;
  isEdit: boolean;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-dialog-component.component.html',
  styleUrls: ['./user-dialog-component.component.css']
})
export class UserFormDialogComponent implements OnInit {
  userForm!: FormGroup;
  isSubmitting = false;
  passwordVisible = false;

  // Role options
  roleOptions = [
    { id: 1, name: 'ADMIN', label: 'Administrator', description: 'Full system access' },
    { id: 2, name: 'CLIENT', label: 'Client', description: 'Submit and view own requests' },
    { id: 3, name: 'GERANT', label: 'Manager', description: 'Manage users and requests' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData
  ) {}

  ngOnInit(): void {
    this.userForm = this.createForm();
    
    if (this.data.isEdit && this.data.user) {
      this.populateForm(this.data.user);
    }
  }

  /**
   * Create reactive form
   */
  private createForm(): FormGroup {
    const formConfig: any = {
      firstname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      roleId: ['', Validators.required]
    };

    // Add password field only for creation
    if (!this.data.isEdit) {
      formConfig.password = ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(100),
        this.passwordStrengthValidator
      ]];
    } else {
      // Add active toggle only for editing
      formConfig.active = [true];
    }

    return this.fb.group(formConfig);
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
    
    if (value.length >= 6 && (hasNumber || hasLower || hasUpper)) {
      return null; // Valid
    }
    
    return { passwordStrength: true };
  }

  /**
   * Populate form with user data for editing
   */
  private populateForm(user: User): void {
    const roleId = user.role?.idRole || null;
    
    this.userForm.patchValue({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      roleId: roleId,
      active: user.active
    });
  }

  /**
   * Get form field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['passwordStrength']) return 'Password must contain at least 6 characters with numbers or letters';
    
    return 'Invalid value';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstname: 'First name',
      lastname: 'Last name',
      email: 'Email',
      password: 'Password',
      roleId: 'Role'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if form field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Get role description by ID
   */
  getRoleDescription(roleId: number): string {
    const role = this.roleOptions.find(r => r.id === roleId);
    return role ? role.description : '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = { ...this.userForm.value };
      
      // Convert roleId to number
      if (formData.roleId) {
        formData.roleId = Number(formData.roleId);
      }
      
      // Remove empty fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
          delete formData[key];
        }
      });

      // Close dialog with form data
      setTimeout(() => {
        this.dialogRef.close(formData);
      }, 500); // Small delay to show loading state
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get dialog title
   */
  getDialogTitle(): string {
    return this.data.isEdit ? 'Edit User' : 'Create New User';
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.data.isEdit ? 'Updating...' : 'Creating...';
    }
    return this.data.isEdit ? 'Update User' : 'Create User';
  }

  /**
   * Check if email field should show domain suggestion
   */
  shouldShowEmailSuggestion(): boolean {
    const emailControl = this.userForm.get('email');
    if (!emailControl || !emailControl.value) return false;
    
    const email = emailControl.value.toLowerCase();
    const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com'];
    
    return email.includes('@') && !commonDomains.some(domain => email.endsWith(domain));
  }
}