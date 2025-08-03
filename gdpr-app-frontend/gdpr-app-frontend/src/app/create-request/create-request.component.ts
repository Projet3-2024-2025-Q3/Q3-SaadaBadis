// src/app/components/create-request/create-request.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { ClientNavbarComponent } from '../navbar/navbar.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { RequestService, CreateGDPRRequestDTO } from '../services/request.service';
import { CompanyService, Company } from '../services/company.service';

// Interfaces
interface RequestType {
  value: string;
  label: string;
  icon: string;
  description: string;
  processingTime: string;
}

// Removed the duplicate Company interface since we're importing it from the service

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ClientNavbarComponent
  ],
  templateUrl: './create-request.component.html',
  styleUrls: ['./create-request.component.scss']
})
export class CreateRequestComponent implements OnInit, OnDestroy {
  // Form data
  requestType: string = '';
  companyId: number | null = null;
  requestContent: string = '';

  // UI state
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Data
  currentUser: UserInfo | null = null;
  requestTypes: RequestType[] = [
    {
      value: 'MODIFICATION',
      label: 'Data Modification',
      icon: 'edit',
      description: 'Request to modify or correct your personal data stored by the company.',
      processingTime: '15-30 days'
    },
    {
      value: 'DELETION',
      label: 'Data Deletion',
      icon: 'delete_outline',
      description: 'Request to delete your personal data stored by the company (Right to be forgotten).',
      processingTime: '30 days'
    }
  ];

  companies: Company[] = [];

  // Subject for cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private requestService: RequestService,
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    // Load companies
    this.loadCompanies();

    // Check for pre-selected request type from query params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['type']) {
          this.setRequestTypeFromParam(params['type']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load companies for the select dropdown
   */
  private loadCompanies(): void {
    this.companyService.getAllCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.companies = companies;
        },
        error: (error) => {
          console.error('Error loading companies:', error);
          this.errorMessage = 'Failed to load companies. Please try again.';
          // Fallback to empty array
          this.companies = [];
        }
      });
  }

  /**
   * Set request type from URL parameter
   */
  private setRequestTypeFromParam(type: string): void {
    const typeMap: { [key: string]: string } = {
      'data-access': 'ACCESS',
      'data-deletion': 'DELETION',
      'data-portability': 'PORTABILITY',
      'data-correction': 'MODIFICATION'
    };

    const mappedType = typeMap[type] || type.toUpperCase();
    
    // Only set if it's a valid type
    if (this.requestTypes.some(rt => rt.value === mappedType)) {
      this.requestType = mappedType;
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Clear messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form
    if (!this.validateForm()) {
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    // Prepare request data
    const requestData: CreateGDPRRequestDTO = {
      requestType: this.requestType,
      requestContent: this.requestContent.trim(),
      userId: this.currentUser.id,
      companyId: this.companyId!
    };

    // Submit request
    this.isLoading = true;

    this.requestService.createRequest(requestData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = '🎉 Request submitted successfully! You will receive a confirmation email shortly.';
          
          // Redirect to dashboard after success
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Failed to submit request. Please try again.';
          console.error('Create request error:', error);
        }
      });
  }

  /**
   * Validate form data
   */
  private validateForm(): boolean {
    if (!this.requestType) {
      this.errorMessage = 'Please select a request type';
      return false;
    }

    if (!this.companyId) {
      this.errorMessage = 'Please select a company';
      return false;
    }

    if (!this.requestContent.trim()) {
      this.errorMessage = 'Please provide a description for your request';
      return false;
    }

    if (this.requestContent.trim().length < 10) {
      this.errorMessage = 'Request description must be at least 10 characters';
      return false;
    }

    return true;
  }

  /**
   * Event handlers
   */
  onRequestTypeChange(): void {
    this.clearMessages();
  }

  onCompanyChange(): void {
    this.clearMessages();
  }

  onContentChange(): void {
    this.clearMessages();
  }

  /**
   * Clear error and success messages
   */
  private clearMessages(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
    if (this.successMessage) {
      this.successMessage = '';
    }
  }

  /**
   * Get placeholder text based on selected request type
   */
  getPlaceholderText(): string {
    const selectedType = this.requestTypes.find(type => type.value === this.requestType);
    
    if (!selectedType) {
      return 'Please describe your GDPR request in detail...';
    }

    switch (selectedType.value) {
      case 'MODIFICATION':
        return 'Please specify which data needs to be corrected and provide the correct information...';
      case 'DELETION':
        return 'Please specify which data you want to be deleted and the reason for this request...';
      default:
        return 'Please describe your GDPR request in detail...';
    }
  }

  /**
   * Get selected request type details
   */
  getSelectedRequestTypeIcon(): string {
    const selectedType = this.requestTypes.find(type => type.value === this.requestType);
    return selectedType?.icon || 'assignment';
  }

  getSelectedRequestTypeLabel(): string {
    const selectedType = this.requestTypes.find(type => type.value === this.requestType);
    return selectedType?.label || '';
  }

  getSelectedRequestTypeDescription(): string {
    const selectedType = this.requestTypes.find(type => type.value === this.requestType);
    return selectedType?.description || '';
  }

  getProcessingTime(): string {
    const selectedType = this.requestTypes.find(type => type.value === this.requestType);
    return selectedType?.processingTime || '';
  }

  /**
   * Navigation methods
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.requestType = '';
    this.companyId = null;
    this.requestContent = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Get selected company name
   */
  getSelectedCompanyName(): string {
    const selectedCompany = this.companies.find(company => company.idCompany === this.companyId);
    return selectedCompany?.companyName || '';
  }

  /**
   * Check if form is valid for submission
   */
  isFormValid(): boolean {
    return !!(
      this.requestType &&
      this.companyId &&
      this.requestContent.trim().length >= 10
    );
  }

  /**
   * Development helper methods
   */
  fillDemoData(): void {
    this.requestType = 'MODIFICATION';
    this.companyId = 1;
    this.requestContent = 'I would like to update my email address in your system as it has changed recently.';
  }

  /**
   * Get character count color class
   */
  getCharacterCountClass(): string {
    const length = this.requestContent.length;
    if (length > 900) return 'text-warning';
    if (length > 950) return 'text-danger';
    return '';
  }
}