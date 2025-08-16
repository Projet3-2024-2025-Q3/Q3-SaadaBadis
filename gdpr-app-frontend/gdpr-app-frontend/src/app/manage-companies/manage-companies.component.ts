// src/app/components/manage-companies/manage-companies.component.ts (Updated)
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
      width: '600px',
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
      width: '600px',
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
          this.showSnackBar('Company created successfully', 'success');
          // Actualiser la page après création
          setTimeout(() => {
            this.loadCompanies();
          }, 1000);
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
          this.showSnackBar('Company updated successfully', 'success');
          // Actualiser la page après modification
          setTimeout(() => {
            this.loadCompanies();
          }, 1000);
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
          this.showSnackBar('Company deleted successfully', 'success');
          // Actualiser la page après suppression
          setTimeout(() => {
            this.loadCompanies();
          }, 1000);
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

  /**
   * Refresh companies list
   */
  refreshCompanies(): void {
    this.loadCompanies();
  }

  /**
   * Export companies to CSV
   */
  exportToCSV(): void {
    const csvData = this.companies.map(company => ({
      'Company ID': company.idCompany,
      'Company Name': company.companyName,
      'Email': company.email
    }));

    const csvContent = this.convertToCSV(csvData);
    this.downloadCSV(csvContent, 'companies_export.csv');
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Download CSV file
   */
  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// Delete Confirmation Dialog Component (unchanged)
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
    /* Same styles as before for delete dialog */
    /* ... (keeping existing delete dialog styles) ... */
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