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
        Validators.maxLength(100)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email, 
        Validators.maxLength(100)
      ]]
    });
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
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${errors['maxlength'].requiredLength} characters`;
    
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

      console.log('Sending company data to backend:', formData);

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
}