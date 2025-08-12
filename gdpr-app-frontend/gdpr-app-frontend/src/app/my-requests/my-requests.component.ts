// src/app/components/my-requests/my-requests.component.ts
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

// Components
import { ClientNavbarComponent } from '../navbar/navbar.component';
import { RequestDetailsDialogComponent } from '../request-details-dialog/request-details-dialog.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { RequestService, GDPRRequest } from '../services/request.service';
import { CompanyService, Company } from '../services/company.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    MatDividerModule,
    ClientNavbarComponent
  ],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.scss']
})
export class MyRequestsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  // Data
  currentUser: UserInfo | null = null;
  requests: GDPRRequest[] = [];
  companies: Company[] = [];
  dataSource: MatTableDataSource<GDPRRequest>;
  
  // Table columns
  displayedColumns: string[] = ['id', 'requestType', 'company', 'status'];
  
  // Filter properties
  searchText: string = '';
  selectedStatus: string = 'all';
  selectedType: string = 'all';
  selectedCompany: string = 'all';
  
  // Statistics
  statistics = {
    total: 0,
    pending: 0,
    completed: 0
  };
  
  // UI State
  isLoading: boolean = true;
  selectedTab: number = 0;
  
  // Status options
  statusOptions = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' },
    { value: 'COMPLETED', label: 'Completed', icon: 'check_circle' },
    { value: 'PROCESSED', label: 'Processed', icon: 'check_circle' }
  ];
  
  // Request type options
  typeOptions = [
    { value: 'all', label: 'All Types', icon: 'category' },
    { value: 'MODIFICATION', label: 'Data Modification', icon: 'edit' },
    { value: 'DELETION', label: 'Data Deletion', icon: 'delete' }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private requestService: RequestService,
    private companyService: CompanyService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<GDPRRequest>([]);
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadRequests();
    this.loadCompanies();
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.sort = this.sort;
      
      // Custom sort for ID column
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch(property) {
          case 'id': 
            return item.id || item.id;
          default: 
            return item.id;
        }
      };
      
      // Custom filter predicate
      this.dataSource.filterPredicate = (data: GDPRRequest, filter: string) => {
        const searchStr = filter.toLowerCase();
        const requestId = (data.id || data.id || '').toString();
        return data.requestContent.toLowerCase().includes(searchStr) ||
               requestId.includes(searchStr) ||
               data.requestType.toLowerCase().includes(searchStr) ||
               data.status.toLowerCase().includes(searchStr);
      };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRequests(): void {
    this.isLoading = true;
    
    this.requestService.getMyRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.requests = requests;
          
          // Debug: Log the structure of the first request to see how company data is structured
          if (requests.length > 0) {
            console.log('Request structure:', requests[0]);
            console.log('Company data:', requests[0].company);
            console.log('CompanyId:', requests[0].companyId);
          }
          
          this.updateDataSource();
          this.calculateStatistics();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading requests:', error);
          this.showSnackBar('Failed to load requests', 'error');
          this.isLoading = false;
        }
      });
  }

  loadCompanies(): void {
    this.companyService.getAllCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.companies = companies;
        },
        error: (error) => {
          console.error('Error loading companies:', error);
        }
      });
  }

  updateDataSource(): void {
    let filteredData = [...this.requests];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filteredData = filteredData.filter(req => 
        req.status.toUpperCase() === this.selectedStatus ||
        (this.selectedStatus === 'COMPLETED' && req.status === 'PROCESSED')
      );
    }

    // Filter by type
    if (this.selectedType !== 'all') {
      filteredData = filteredData.filter(req => req.requestType === this.selectedType);
    }

    // Filter by company - handle multiple possible structures
    if (this.selectedCompany !== 'all') {
      const companyId = parseInt(this.selectedCompany);
      filteredData = filteredData.filter(req => {
        // Check all possible company ID locations
        if (req.companyId === companyId) {
          return true;
        }
        if (req.company) {
          if (req.company.idCompany === companyId) {
            return true;
          }
          if (req.company.idCompany === companyId) {
            return true;
          }
        }
        return false;
      });
    }

    // Apply search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filteredData = filteredData.filter(req => {
        const companyName = this.getCompanyName(req).toLowerCase();
        const requestId = (req.id || req.id || '').toString();
        return req.requestContent.toLowerCase().includes(search) ||
               requestId.includes(search) ||
               req.requestType.toLowerCase().includes(search) ||
               req.status.toLowerCase().includes(search) ||
               companyName.includes(search);
      });
    }

    this.dataSource.data = filteredData;
    
    // Reset filter for mat-table internal filtering
    this.dataSource.filter = '';
  }

  calculateStatistics(): void {
    this.statistics = {
      total: this.requests.length,
      pending: this.requests.filter(r => r.status === 'PENDING').length,
      completed: this.requests.filter(r => 
        r.status === 'COMPLETED' || r.status === 'PROCESSED'
      ).length
    };
  }

  applyFilter(): void {
    this.updateDataSource();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.selectedCompany = 'all';
    this.updateDataSource();
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    
    switch (index) {
      case 0:
        this.selectedStatus = 'all';
        break;
      case 1:
        this.selectedStatus = 'PENDING';
        break;
      case 2:
        this.selectedStatus = 'COMPLETED';
        break;
    }
    
    this.updateDataSource();
  }

  viewRequest(request: GDPRRequest): void {
    // Open dialog with request details
    const dialogRef = this.dialog.open(RequestDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        request: request,
        companyName: this.getCompanyName(request)
      }
    });

    // Handle dialog result
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'edit') {
          this.editRequest(result.request);
        } else if (result.action === 'delete') {
          this.deleteRequest(result.request);
        }
      }
    });
  }

  editRequest(request: GDPRRequest): void {
    if (request.status !== 'PENDING') {
      this.showSnackBar('Only pending requests can be edited', 'warning');
      return;
    }
    
    const requestId = request.id || request.id;
    console.log('Edit request ID:', requestId);
    this.showSnackBar(`Edit request #${requestId} - Feature coming soon!`, 'info');
  }

  deleteRequest(request: GDPRRequest): void {
    if (request.status !== 'PENDING') {
      this.showSnackBar('Only pending requests can be deleted', 'warning');
      return;
    }

    const requestId = request.id || request.id;
    
    if (confirm(`Are you sure you want to delete request #${requestId}?`)) {
      this.requestService.deleteRequest(requestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackBar(`Request #${requestId} deleted successfully`, 'success');
            this.loadRequests();
          },
          error: (error) => {
            console.error('Error deleting request:', error);
            this.showSnackBar('Failed to delete request', 'error');
          }
        });
    }
  }

  createNewRequest(): void {
    this.router.navigate(['/create']);
  }

  refreshData(): void {
    this.loadRequests();
    this.showSnackBar('Data refreshed', 'success');
  }

  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'schedule';
      case 'COMPLETED':
      case 'PROCESSED':
        return 'check_circle';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'warn';
      case 'COMPLETED':
      case 'PROCESSED':
        return 'primary';
      default:
        return '';
    }
  }

  getTypeIcon(type: string): string {
    return type === 'MODIFICATION' ? 'edit' : 'delete';
  }

  getCompanyName(request: any): string {
    // Check if company object exists with name
    if (request.company) {
      return request.company.companyName || request.company.name || 'Unknown';
    }
    
    // Fallback to companyId lookup
    if (request.companyId) {
      const company = this.companies.find(c => c.idCompany === request.companyId);
      return company ? company.companyName : 'Unknown';
    }
    
    // Additional check for direct company reference
    if (request.idCompany) {
      const company = this.companies.find(c => c.idCompany === request.idCompany);
      return company ? company.companyName : 'Unknown';
    }
    
    return 'Unknown';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  private showSnackBar(message: string, type: string = 'info'): void {
    const config: any = {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    };

    if (type === 'error') {
      config.panelClass = ['error-snackbar'];
    } else if (type === 'success') {
      config.panelClass = ['success-snackbar'];
    } else if (type === 'warning') {
      config.panelClass = ['warning-snackbar'];
    }

    this.snackBar.open(message, 'Close', config);
  }
}