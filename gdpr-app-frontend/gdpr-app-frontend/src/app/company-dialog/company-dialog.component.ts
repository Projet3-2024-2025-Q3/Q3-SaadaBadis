// src/app/components/company-dialog/company-dialog.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material Imports
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Types
import { Company } from '../services/company.service';

// Dialog Data Interface
export interface CompanyFormDialogData {
  company?: Company;
  isEdit: boolean;
}

@Component({
  selector: 'app-company-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './company-dialog.component.html',
  styleUrls: ['./company-dialog.component.css']
})
export class CompanyDialogComponent implements OnInit {
  companyForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CompanyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyFormDialogData
  ) {}

  ngOnInit(): void {
    this.companyForm = this.createForm();
    
    if (this.data.isEdit && this.data.company) {
      this.populateForm(this.data.company);
    }
  }

  /**
   * Create reactive form
   */
  private createForm(): FormGroup {
    return this.fb.group({
      companyName: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(100),
        this.companyNameValidator
      ]],
      email: ['', [
        Validators.required, 
        Validators.email, 
        Validators.maxLength(100),
        this.businessEmailValidator
      ]]
    });
  }

  /**
   * Custom company name validator
   */
  private companyNameValidator(control: any) {
    if (!control.value) return null;
    
    const value = control.value.trim();
    
    // Check for minimum meaningful length
    if (value.length < 2) {
      return { minLength: { requiredLength: 2, actualLength: value.length } };
    }
    
    // Check for valid characters (letters, numbers, spaces, common business symbols)
    const validPattern = /^[a-zA-Z0-9\s\-\.\&\(\)\'\"]+$/;
    if (!validPattern.test(value)) {
      return { invalidCharacters: true };
    }
    
    // Check for consecutive spaces
    if (/\s{2,}/.test(value)) {
      return { consecutiveSpaces: true };
    }
    
    // Check if it starts or ends with space
    if (value !== value.trim()) {
      return { leadingTrailingSpaces: true };
    }
    
    return null;
  }

  /**
   * Custom business email validator
   */
  private businessEmailValidator(control: any) {
    if (!control.value) return null;
    
    const email = control.value.toLowerCase();
    
    // Basic email format check (already handled by Validators.email)
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { invalidEmail: true };
    }
    
    // Check for common personal email domains (optional warning)
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (personalDomains.some(domain => email.endsWith(domain))) {
      return { personalEmail: true }; // Warning, not blocking
    }
    
    return null;
  }

  /**
   * Populate form with company data for editing
   */
  private populateForm(company: Company): void {
    this.companyForm.patchValue({
      companyName: company.companyName,
      email: company.email
    });
  }

  /**
   * Get form field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.companyForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email'] || errors['invalidEmail']) return 'Please enter a valid email address';
    if (errors['personalEmail']) return 'Consider using a business email address';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['invalidCharacters']) return 'Company name contains invalid characters';
    if (errors['consecutiveSpaces']) return 'Company name cannot have consecutive spaces';
    if (errors['leadingTrailingSpaces']) return 'Company name cannot start or end with spaces';
    
    return 'Invalid value';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      companyName: 'Company name',
      email: 'Email address'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if form field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  /**
   * Check if field has warning (like personal email)
   */
  hasFieldWarning(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return false;
    
    // Only show warning for non-blocking errors
    return !!(field.errors['personalEmail']);
  }

  /**
   * Get field warning message
   */
  getFieldWarning(fieldName: string): string {
    const field = this.companyForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    
    if (field.errors['personalEmail']) {
      return 'Consider using a business email address for better credibility';
    }
    
    return '';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.companyForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = { ...this.companyForm.value };
      
      // Trim whitespace from string fields
      if (formData.companyName) {
        formData.companyName = formData.companyName.trim();
      }
      if (formData.email) {
        formData.email = formData.email.trim().toLowerCase();
      }
      
      // Remove empty fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
          delete formData[key];
        }
      });

      console.log('Sending company data to backend:', formData); // Debug log

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
    Object.keys(this.companyForm.controls).forEach(key => {
      const control = this.companyForm.get(key);
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
    return this.data.isEdit ? 'Edit Company' : 'Create New Company';
  }

  /**
   * Get submit button text
   */
  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.data.isEdit ? 'Updating...' : 'Creating...';
    }
    return this.data.isEdit ? 'Update Company' : 'Create Company';
  }

  /**
   * Check if email field should show domain suggestion
   */
  shouldShowEmailSuggestion(): boolean {
    const emailControl = this.companyForm.get('email');
    if (!emailControl || !emailControl.value) return false;
    
    const email = emailControl.value.toLowerCase();
    const businessDomains = ['company.com', 'corp.com', 'inc.com', 'ltd.com'];
    
    return email.includes('@') && !businessDomains.some(domain => email.endsWith(domain));
  }

  /**
   * Get character count for field
   */
  getCharacterCount(fieldName: string): number {
    const field = this.companyForm.get(fieldName);
    return field?.value?.length || 0;
  }

  /**
   * Get max length for field
   */
  getMaxLength(fieldName: string): number {
    const maxLengths: { [key: string]: number } = {
      companyName: 100,
      email: 100
    };
    return maxLengths[fieldName] || 0;
  }

  /**
   * Preview company name formatting
   */
  getFormattedCompanyName(): string {
    const name = this.companyForm.get('companyName')?.value;
    if (!name) return '';
    
    return name.trim()
      .split(' ')
      .filter((word: string) => word.length > 0)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}