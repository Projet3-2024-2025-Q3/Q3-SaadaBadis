// src/app/components/manage-companies/manage-companies.component.ts
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';
import { CompanyDialogComponent, CompanyFormDialogData } from '../company-dialog/company-dialog.component';

// Services
import { CompanyService, Company } from '../services/company.service';

// Delete Dialog Data Interface
interface DeleteCompanyDialogData {
  company: Company;
}

@Component({
  selector: 'app-manage-companies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    AdminNavbarComponent,
    CompanyDialogComponent
  ],
  templateUrl: './manage-companies.component.html',
  styleUrls: ['./manage-companies.component.css']
})
export class ManageCompaniesComponent implements OnInit, OnDestroy {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  displayedColumns: string[] = ['idCompany', 'companyName', 'email', 'actions'];
  isLoading = true;
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private companyService: CompanyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all companies
   */
  loadCompanies(): void {
    this.isLoading = true;
    this.companyService.getAllCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.companies = companies;
          this.filteredCompanies = companies;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading companies:', error);
          this.showSnackBar('Error loading companies: ' + error.message, 'error');
          this.isLoading = false;
        }
      });
  }

  /**
   * Filter companies based on search term
   */
  applyFilter(): void {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredCompanies = this.companies.filter(company =>
      company.companyName.toLowerCase().includes(searchLower) ||
      company.email.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Open create company dialog
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CompanyDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        isEdit: false 
      } as CompanyFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog closed with result:', result);
        this.createCompany(result);
      }
    });
  }

  /**
   * Open edit company dialog
   */
  openEditDialog(company: Company): void {
    console.log('Opening edit dialog for company:', company);
    
    const dialogRef = this.dialog.open(CompanyDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        company: { ...company }, 
        isEdit: true 
      } as CompanyFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Edit dialog closed with result:', result);
        this.updateCompany(company.idCompany, result);
      }
    });
  }

  /**
   * Open delete confirmation dialog
   */
  openDeleteDialog(company: Company): void {
    const dialogRef = this.dialog.open(DeleteCompanyDialogComponent, {
      width: '450px',
      data: { company }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteCompany(company.idCompany);
      }
    });
  }

  /**
   * Create new company
   */
  private createCompany(companyData: any): void {
    console.log('Creating company with data:', companyData);
    
    this.companyService.createCompany(companyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCompany) => {
          console.log('Company created successfully:', newCompany);
          this.addCompanyToArrays(newCompany);
          this.showSnackBar('Company created successfully', 'success');
        },
        error: (error) => {
          console.error('Error creating company:', error);
          this.showSnackBar('Error creating company: ' + error.message, 'error');
        }
      });
  }

  /**
   * Update company
   */
  private updateCompany(companyId: number, companyData: any): void {
    console.log('Updating company', companyId, 'with data:', companyData);
    
    this.companyService.updateCompany(companyId, companyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCompany) => {
          console.log('Company updated successfully:', updatedCompany);
          this.updateCompanyInArrays(updatedCompany);
          this.showSnackBar('Company updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating company:', error);
          this.showSnackBar('Error updating company: ' + error.message, 'error');
        }
      });
  }

  /**
   * Delete company
   */
  private deleteCompany(companyId: number): void {
    this.companyService.deleteCompany(companyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.removeCompanyFromArrays(companyId);
          this.showSnackBar('Company deleted successfully', 'success');
        },
        error: (error) => {
          this.showSnackBar('Cannot delete company: This company is linked to existing requests or users. Please remove all associated data first.', 'error');
        }
      });
  }

  /**
   * Update company in both companies and filteredCompanies arrays
   */
  private updateCompanyInArrays(updatedCompany: Company): void {
    // Update in main companies array
    const companyIndex = this.companies.findIndex(c => c.idCompany === updatedCompany.idCompany);
    if (companyIndex !== -1) {
      this.companies[companyIndex] = updatedCompany;
    }

    // Update in filtered companies array
    const filteredIndex = this.filteredCompanies.findIndex(c => c.idCompany === updatedCompany.idCompany);
    if (filteredIndex !== -1) {
      this.filteredCompanies[filteredIndex] = updatedCompany;
    }
  }

  /**
   * Add new company to both arrays
   */
  private addCompanyToArrays(newCompany: Company): void {
    // Add to main companies array
    this.companies.push(newCompany);
    
    // Check if company matches current filter and add to filtered array
    const searchLower = this.searchTerm.toLowerCase();
    
    const matchesFilter = !searchLower || 
      newCompany.companyName.toLowerCase().includes(searchLower) ||
      newCompany.email.toLowerCase().includes(searchLower);
    
    if (matchesFilter) {
      this.filteredCompanies.push(newCompany);
    }
  }

  /**
   * Remove company from both arrays after deletion
   */
  private removeCompanyFromArrays(companyId: number): void {
    // Remove from main companies array
    this.companies = this.companies.filter(c => c.idCompany !== companyId);
    
    // Remove from filtered companies array
    this.filteredCompanies = this.filteredCompanies.filter(c => c.idCompany !== companyId);
  }

  /**
   * Show snackbar message
   */
  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}

// Delete Confirmation Dialog Component
@Component({
  selector: 'app-delete-company-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="warning-icon">warning</mat-icon>
      Confirm Deletion
    </h2>

    <mat-dialog-content>
      <div class="deletion-content">
        <div class="company-info">
          <mat-icon class="company-icon">business</mat-icon>
          <div class="company-details">
            <h3>{{ data.company.companyName }}</h3>
            <p class="company-email">{{ data.company.email }}</p>
            <span class="company-id">ID: #{{ data.company.idCompany }}</span>
          </div>
        </div>
        
        <div class="warning-message">
          <p class="warning-text">
            Are you sure you want to permanently delete this company?
          </p>
          <p class="warning-subtext">
            This action cannot be undone. If this company is linked to requests or users, the deletion may fail.
          </p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">
        Cancel
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true" class="delete-btn">
        <mat-icon>delete</mat-icon>
        Delete Company
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Dialog Title */
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px !important;
      font-weight: 600 !important;
      color: #f44336 !important;
      margin-bottom: 16px !important;
    }

    .warning-icon {
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
      color: #f44336 !important;
    }

    /* Dialog Content */
    mat-dialog-content {
      padding: 0 24px 16px 24px !important;
      min-width: 400px;
    }

    .deletion-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Company Info Section */
    .company-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #d32f2f;
    }

    .company-icon {
      font-size: 40px !important;
      width: 40px !important;
      height: 40px !important;
      color: #d32f2f;
      background: rgba(211, 47, 47, 0.1);
      border-radius: 50%;
      padding: 8px;
    }

    .company-details h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .company-email {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .company-id {
      display: inline-block;
      background: rgba(211, 47, 47, 0.1);
      color: #d32f2f;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Warning Message */
    .warning-message {
      text-align: center;
      padding: 16px;
    }

    .warning-text {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .warning-subtext {
      font-size: 14px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }

    /* Dialog Actions */
    mat-dialog-actions {
      padding: 16px 24px 20px 24px !important;
      gap: 12px;
    }

    .cancel-btn {
      min-width: 80px;
      height: 40px;
      border-radius: 20px !important;
      font-weight: 500 !important;
      color: #666;
    }

    .cancel-btn:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .delete-btn {
      min-width: 120px;
      height: 40px;
      border-radius: 20px !important;
      font-weight: 600 !important;
      background-color: #f44336 !important;
      color: white !important;
    }

    .delete-btn:hover {
      background-color: #d32f2f !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    }

    .delete-btn .mat-icon {
      margin-right: 8px;
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    /* Responsive Design */
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 300px;
        padding: 0 16px 16px 16px !important;
      }
      
      .company-info {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
      
      .company-details h3 {
        font-size: 16px;
      }
      
      mat-dialog-actions {
        padding: 16px 16px 20px 16px !important;
        flex-direction: column-reverse;
      }
      
      mat-dialog-actions button {
        width: 100%;
        margin: 0 0 8px 0 !important;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class DeleteCompanyDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeleteCompanyDialogData
  ) {}
}