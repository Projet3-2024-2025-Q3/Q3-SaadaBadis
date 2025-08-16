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
  standalone: true, // Standalone component - no NgModule required
  imports: [
    CommonModule,
    FormsModule,
    // Material Design modules for UI components
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
  // ViewChild to access MatSort directive for table sorting
  @ViewChild(MatSort) sort!: MatSort;

  // Data properties
  currentUser: UserInfo | null = null;    // Current authenticated user
  requests: GDPRRequest[] = [];           // All user requests from API
  companies: Company[] = [];              // All companies for lookup
  dataSource: MatTableDataSource<GDPRRequest>; // Material table data source
  
  // Table configuration - columns to display
  displayedColumns: string[] = ['id', 'requestType', 'company', 'status'];
  
  // Filter properties for search and filtering functionality
  searchText: string = '';        // Text search input
  selectedStatus: string = 'all'; // Status filter dropdown
  selectedType: string = 'all';   // Request type filter dropdown
  selectedCompany: string = 'all'; // Company filter dropdown
  
  // Statistics for dashboard display
  statistics = {
    total: 0,
    pending: 0,
    completed: 0
  };
  
  // UI State management
  isLoading: boolean = true;  // Loading spinner state
  selectedTab: number = 0;    // Active tab index
  
  // Configuration arrays for dropdown options
  statusOptions = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' },
    { value: 'COMPLETED', label: 'Completed', icon: 'check_circle' },
    { value: 'PROCESSED', label: 'Processed', icon: 'check_circle' }
  ];
  
  typeOptions = [
    { value: 'all', label: 'All Types', icon: 'category' },
    { value: 'MODIFICATION', label: 'Data Modification', icon: 'edit' },
    { value: 'DELETION', label: 'Data Deletion', icon: 'delete' }
  ];
  
  // RxJS Subject for managing subscriptions and preventing memory leaks
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,     // Authentication service
    private requestService: RequestService, // GDPR request operations
    private companyService: CompanyService, // Company data operations
    private router: Router,               // Navigation
    private dialog: MatDialog,            // Material dialog service
    private snackBar: MatSnackBar         // Toast notifications
  ) {
    // Initialize empty data source for Material table
    this.dataSource = new MatTableDataSource<GDPRRequest>([]);
  }

  ngOnInit(): void {
    // Check authentication status before loading data
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Subscribe to current user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$)) // Unsubscribe when component is destroyed
      .subscribe(user => {
        this.currentUser = user;
      });

    // Load initial data
    this.loadRequests();
    this.loadCompanies();
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      // Set up table sorting after view is initialized
      this.dataSource.sort = this.sort;
      
      // Custom sort accessor for handling different ID property names
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch(property) {
          case 'id': 
            return item.id || item.id; // Handle different ID property names
          default: 
            return item.id;
        }
      };
      
      // Custom filter predicate for text search functionality
      this.dataSource.filterPredicate = (data: GDPRRequest, filter: string) => {
        const searchStr = filter.toLowerCase();
        const requestId = (data.id || data.id || '').toString();
        // Search across multiple fields
        return data.requestContent.toLowerCase().includes(searchStr) ||
               requestId.includes(searchStr) ||
               data.requestType.toLowerCase().includes(searchStr) ||
               data.status.toLowerCase().includes(searchStr);
      };
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user's GDPR requests from API
   */
  loadRequests(): void {
    this.isLoading = true;
    
    this.requestService.getMyRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.requests = requests;
          
          // Debug logging to understand data structure
          if (requests.length > 0) {
            console.log('Request structure:', requests[0]);
            console.log('Company data:', requests[0].company);
            console.log('CompanyId:', requests[0].companyId);
          }
          
          // Update table and statistics after data load
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

  /**
   * Load companies for dropdown and display purposes
   */
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

  /**
   * Update table data source based on current filters
   * Applies all active filters to the requests array
   */
  updateDataSource(): void {
    let filteredData = [...this.requests]; // Start with copy of all requests

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      filteredData = filteredData.filter(req => 
        req.status.toUpperCase() === this.selectedStatus ||
        // Handle PROCESSED as equivalent to COMPLETED
        (this.selectedStatus === 'COMPLETED' && req.status === 'PROCESSED')
      );
    }

    // Apply request type filter
    if (this.selectedType !== 'all') {
      filteredData = filteredData.filter(req => req.requestType === this.selectedType);
    }

    // Apply company filter - handle multiple possible data structures
    if (this.selectedCompany !== 'all') {
      const companyId = parseInt(this.selectedCompany);
      filteredData = filteredData.filter(req => {
        // Check various ways company ID might be stored
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

    // Apply text search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filteredData = filteredData.filter(req => {
        const companyName = this.getCompanyName(req).toLowerCase();
        const requestId = (req.id || req.id || '').toString();
        // Search across multiple fields
        return req.requestContent.toLowerCase().includes(search) ||
               requestId.includes(search) ||
               req.requestType.toLowerCase().includes(search) ||
               req.status.toLowerCase().includes(search) ||
               companyName.includes(search);
      });
    }

    // Update table data source
    this.dataSource.data = filteredData;
    
    // Reset internal Material table filter
    this.dataSource.filter = '';
  }

  /**
   * Calculate statistics for dashboard display
   */
  calculateStatistics(): void {
    this.statistics = {
      total: this.requests.length,
      pending: this.requests.filter(r => r.status === 'PENDING').length,
      completed: this.requests.filter(r => 
        r.status === 'COMPLETED' || r.status === 'PROCESSED'
      ).length
    };
  }

  /**
   * Trigger filter application (called from template)
   */
  applyFilter(): void {
    this.updateDataSource();
  }

  /**
   * Reset all filters to default values
   */
  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.selectedCompany = 'all';
    this.updateDataSource();
  }

  /**
   * Handle tab change and automatically filter by status
   */
  onTabChange(index: number): void {
    this.selectedTab = index;
    
    // Auto-filter based on selected tab
    switch (index) {
      case 0:
        this.selectedStatus = 'all';      // All requests tab
        break;
      case 1:
        this.selectedStatus = 'PENDING';  // Pending requests tab
        break;
      case 2:
        this.selectedStatus = 'COMPLETED'; // Completed requests tab
        break;
    }
    
    this.updateDataSource();
  }

  /**
   * Open request details dialog
   */
  viewRequest(request: GDPRRequest): void {
    // Open Material dialog with request details
    const dialogRef = this.dialog.open(RequestDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        request: request,
        companyName: this.getCompanyName(request)
      }
    });

    // Handle actions from dialog (edit, delete)
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

  /**
   * Edit request functionality (placeholder)
   */
  editRequest(request: GDPRRequest): void {
    // Only pending requests can be edited
    if (request.status !== 'PENDING') {
      this.showSnackBar('Only pending requests can be edited', 'warning');
      return;
    }
    
    const requestId = request.id || request.id;
    console.log('Edit request ID:', requestId);
    this.showSnackBar(`Edit request #${requestId} - Feature coming soon!`, 'info');
  }

  /**
   * Delete request with confirmation
   */
  deleteRequest(request: GDPRRequest): void {
    // Only pending requests can be deleted
    if (request.status !== 'PENDING') {
      this.showSnackBar('Only pending requests can be deleted', 'warning');
      return;
    }

    const requestId = request.id || request.id;
    
    // Confirm deletion with user
    if (confirm(`Are you sure you want to delete request #${requestId}?`)) {
      this.requestService.deleteRequest(requestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackBar(`Request #${requestId} deleted successfully`, 'success');
            this.loadRequests(); // Reload data after deletion
          },
          error: (error) => {
            console.error('Error deleting request:', error);
            this.showSnackBar('Failed to delete request', 'error');
          }
        });
    }
  }

  /**
   * Navigate to create new request page
   */
  createNewRequest(): void {
    this.router.navigate(['/create']);
  }

  /**
   * Refresh data from API
   */
  refreshData(): void {
    this.loadRequests();
    this.showSnackBar('Data refreshed', 'success');
  }

  /**
   * Get appropriate icon for request status
   */
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

  /**
   * Get color theme for status display
   */
  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'warn';    // Orange/yellow theme
      case 'COMPLETED':
      case 'PROCESSED':
        return 'primary'; // Blue theme
      default:
        return '';
    }
  }

  /**
   * Get appropriate icon for request type
   */
  getTypeIcon(type: string): string {
    return type === 'MODIFICATION' ? 'edit' : 'delete';
  }

  /**
   * Get company name from request object
   * Handles multiple possible data structures
   */
  getCompanyName(request: any): string {
    // Check if company object exists with name
    if (request.company) {
      return request.company.companyName || request.company.name || 'Unknown';
    }
    
    // Fallback to companyId lookup in companies array
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

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  /**
   * Show toast notification with different styles
   */
  private showSnackBar(message: string, type: string = 'info'): void {
    const config: any = {
      duration: 3000,                    // 3 second duration
      horizontalPosition: 'right',       // Position on right side
      verticalPosition: 'top'            // Position at top
    };

    // Apply different CSS classes based on message type
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