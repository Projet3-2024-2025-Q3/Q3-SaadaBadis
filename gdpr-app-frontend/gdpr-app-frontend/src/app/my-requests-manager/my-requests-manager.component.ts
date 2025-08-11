// src/app/components/manager-requests/manager-requests.component.ts
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

// Components
import { ManagerNavbarComponent } from '../manager-navbar/manager-navbar.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { RequestService, GDPRRequest } from '../services/request.service';

@Component({
  selector: 'app-manager-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
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
    MatCheckboxModule,
    ManagerNavbarComponent
  ],
  templateUrl: './my-requests-manager.component.html',
  styleUrls: ['./my-requests-manager.component.css']
})
export class ManagerRequestsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Data
  currentUser: UserInfo | null = null;
  allRequests: GDPRRequest[] = [];
  dataSource: MatTableDataSource<GDPRRequest>;
  selection = new SelectionModel<GDPRRequest>(true, []);
  
  // Table columns - Added selection column for batch operations
  displayedColumns: string[] = ['select', 'id', 'user', 'requestType', 'company', 'date', 'status', 'actions'];
  
  // Filter properties
  searchText: string = '';
  selectedStatus: string = 'all';
  selectedType: string = 'all';
  selectedDateRange: string = 'all';
  
  // Statistics
  statistics = {
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    inProgress: 0
  };
  
  // UI State
  isLoading: boolean = true;
  isProcessing: boolean = false;
  selectedTab: number = 0;
  
  // Status options - Updated with IN_PROGRESS
  statusOptions = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: 'autorenew' },
    { value: 'PROCESSED', label: 'Processed', icon: 'check_circle' },
    { value: 'REJECTED', label: 'Rejected', icon: 'cancel' }
  ];
  
  // Request type options
  typeOptions = [
    { value: 'all', label: 'All Types', icon: 'category' },
    { value: 'ACCESS', label: 'Data Access', icon: 'visibility' },
    { value: 'DELETION', label: 'Data Deletion', icon: 'delete' },
    { value: 'PORTABILITY', label: 'Data Portability', icon: 'import_export' },
    { value: 'RECTIFICATION', label: 'Data Correction', icon: 'edit' }
  ];
  
  private destroy$ = new Subject<void>();
  private companyId: number | null = null;

  constructor(
    private authService: AuthService,
    public requestService: RequestService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<GDPRRequest>([]);
  }

  ngOnInit(): void {
    // Check if user is manager or admin
    if (!this.authService.isManager() && !this.authService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        // Store company ID if manager
        if (user && user.role === 'GERANT') {
          this.companyId = (user as any).companyId || null;
        }
      });

    this.loadAllRequests();
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      
      // Custom filter predicate
      this.dataSource.filterPredicate = (data: GDPRRequest, filter: string) => {
        const searchStr = filter.toLowerCase();
        const userName = this.getUserName(data).toLowerCase();
        const userEmail = this.getUserEmail(data).toLowerCase();
        const companyName = this.getCompanyName(data).toLowerCase();
        
        return data.id.toString().includes(searchStr) ||
               data.requestContent.toLowerCase().includes(searchStr) ||
               data.requestType.toLowerCase().includes(searchStr) ||
               data.status.toLowerCase().includes(searchStr) ||
               userName.includes(searchStr) ||
               userEmail.includes(searchStr) ||
               companyName.includes(searchStr);
      };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllRequests(): void {
    this.isLoading = true;
    
    // Use appropriate method based on role
    let requestObservable;
    

      requestObservable = this.requestService.getAllRequests();

    
    requestObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          console.log('Loaded requests:', requests);
          
          // Debug: Check if requests have valid IDs
          requests.forEach((req, index) => {
            const requestId = this.getRequestId(req);
            if (!requestId || requestId <= 0) {
              console.warn(`Request at index ${index} has no valid ID:`, req);
            }
          });
          
          this.allRequests = requests;
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

  applyFilter(): void {
    this.updateDataSource();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
    this.selectedDateRange = 'all';
    this.updateDataSource();
  }

  updateDataSource(): void {
    let filteredData = [...this.allRequests];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filteredData = filteredData.filter(req => 
        req.status.toUpperCase() === this.selectedStatus
      );
    }

    // Filter by type
    if (this.selectedType !== 'all') {
      filteredData = filteredData.filter(req => 
        req.requestType.toUpperCase() === this.selectedType
      );
    }

    // Filter by date range
    if (this.selectedDateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch(this.selectedDateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredData = filteredData.filter(req => 
        new Date(req.createdAt) >= startDate
      );
    }

    // Apply search filter
    if (this.searchText) {
      this.dataSource.filter = this.searchText.trim().toLowerCase();
    } else {
      this.dataSource.filter = '';
    }

    this.dataSource.data = filteredData;
    
    // Clear selection when updating data
    this.selection.clear();
  }

  calculateStatistics(): void {
    this.statistics = {
      total: this.allRequests.length,
      pending: this.allRequests.filter(r => 
        r.status === 'PENDING' || r.status === 'EN_ATTENTE'
      ).length,
      completed: this.allRequests.filter(r => 
        r.status === 'COMPLETED' || r.status === 'TERMINE' || r.status === 'APPROVED'
      ).length,
      rejected: this.allRequests.filter(r => 
        r.status === 'REJECTED' || r.status === 'REFUSE'
      ).length,
      inProgress: this.allRequests.filter(r => 
        r.status === 'IN_PROGRESS' || r.status === 'EN_COURS' || r.status === 'PROCESSING'
      ).length
    };
  }

  // Helper method to get request ID (handles both id and idGdprRequest)
  private getRequestId(request: GDPRRequest): number {
    return request.id ;
  }

  // Selection methods for batch operations
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  checkboxLabel(row?: GDPRRequest): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    const requestId = this.getRequestId(row);
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${requestId}`;
  }

  // Batch operations
  batchValidate(): void {
    const selectedRequests = this.selection.selected;
    if (selectedRequests.length === 0) {
      this.showSnackBar('Please select requests to validate', 'warning');
      return;
    }

    const pendingRequests = selectedRequests.filter(r => {
      const status = r.status?.toUpperCase();
      return status === 'PENDING' || status === 'IN_PROGRESS';
    });

    if (pendingRequests.length === 0) {
      this.showSnackBar('No pending requests selected', 'warning');
      return;
    }

    if (confirm(`Validate ${pendingRequests.length} request(s)?`)) {
      this.isProcessing = true;
      
      // Extract valid IDs
      const requestIds = pendingRequests
        .map(r => this.getRequestId(r))
        .filter(id => id && id > 0);
      
      if (requestIds.length === 0) {
        this.showSnackBar('No valid request IDs found', 'error');
        this.isProcessing = false;
        return;
      }
      
      this.requestService.batchValidateRequests(requestIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedRequests) => {
            this.showSnackBar(`${updatedRequests.length} requests validated successfully`, 'success');
            this.loadAllRequests();
            this.selection.clear();
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Error validating requests:', error);
            this.showSnackBar('Failed to validate some requests', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  batchReject(): void {
    const selectedRequests = this.selection.selected;
    if (selectedRequests.length === 0) {
      this.showSnackBar('Please select requests to reject', 'warning');
      return;
    }

    const reason = prompt(`Enter rejection reason for ${selectedRequests.length} request(s):`);
    if (reason) {
      this.isProcessing = true;
      
      const requestIds = selectedRequests
        .map(r => this.getRequestId(r))
        .filter(id => id && id > 0);
      
      if (requestIds.length === 0) {
        this.showSnackBar('No valid request IDs found', 'error');
        this.isProcessing = false;
        return;
      }
      
      this.requestService.batchUpdateRequestStatus(requestIds, 'REJECTED')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedRequests) => {
            this.showSnackBar(`${updatedRequests.length} requests rejected`, 'info');
            this.loadAllRequests();
            this.selection.clear();
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Error rejecting requests:', error);
            this.showSnackBar('Failed to reject some requests', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  // Individual actions with validation and proper error handling
  validateRequest(request: any): void {
    const requestId = request.idRequest;
    //alert(request.idRequest)
    
    if (!requestId || requestId <= 0) {
      console.error('Invalid request ID:', request);
      this.showSnackBar('Invalid request ID. Please refresh the page.', 'error');
      return;
    }

    if (confirm(`Validate request #${requestId}?`)) {
      this.isProcessing = true;
      
      this.requestService.validateRequest(requestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedRequest) => {
            this.showSnackBar(`Request #${requestId} validated successfully`, 'success');
            this.updateLocalRequest(requestId, updatedRequest);
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Error validating request:', error);
            this.showSnackBar('Failed to validate request', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  approveRequest(request: GDPRRequest): void {
    const requestId = this.getRequestId(request);
    
    if (!requestId || requestId <= 0) {
      console.error('Invalid request ID:', request);
      this.showSnackBar('Invalid request ID. Please refresh the page.', 'error');
      return;
    }

    if (confirm(`Approve request #${requestId}?`)) {
      this.isProcessing = true;
      
      this.requestService.approveRequest(requestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedRequest) => {
            this.showSnackBar(`Request #${requestId} approved successfully`, 'success');
            this.updateLocalRequest(requestId, updatedRequest);
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Error approving request:', error);
            this.showSnackBar('Failed to approve request', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  markAsInProgress(request: GDPRRequest): void {
    const requestId = this.getRequestId(request);
    
    if (!requestId || requestId <= 0) {
      console.error('Invalid request ID:', request);
      this.showSnackBar('Invalid request ID. Please refresh the page.', 'error');
      return;
    }

    this.isProcessing = true;
    
    this.requestService.markRequestInProgress(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRequest) => {
          this.showSnackBar(`Request #${requestId} marked as in progress`, 'info');
          this.updateLocalRequest(requestId, updatedRequest);
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error updating request:', error);
          this.showSnackBar('Failed to update request', 'error');
          this.isProcessing = false;
        }
      });
  }

  rejectRequest(request: GDPRRequest): void {
    const requestId = this.getRequestId(request);
    
    if (!requestId || requestId <= 0) {
      console.error('Invalid request ID:', request);
      this.showSnackBar('Invalid request ID. Please refresh the page.', 'error');
      return;
    }

    const reason = prompt(`Enter rejection reason for request #${requestId}:`);
    if (reason) {
      this.isProcessing = true;
      
      this.requestService.rejectRequest(requestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedRequest) => {
            this.showSnackBar(`Request #${requestId} rejected`, 'info');
            this.updateLocalRequest(requestId, updatedRequest);
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Error rejecting request:', error);
            this.showSnackBar('Failed to reject request', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  deleteRequest(request: GDPRRequest): void {
    const requestId = this.getRequestId(request);
    
    if (!requestId || requestId <= 0) {
      console.error('Invalid request ID:', request);
      this.showSnackBar('Invalid request ID. Please refresh the page.', 'error');
      return;
    }

    if (confirm(`Are you sure you want to delete request #${requestId}? This action cannot be undone.`)) {
      this.isProcessing = true;
      
      this.requestService.deleteRequest(requestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackBar(`Request #${requestId} deleted successfully`, 'success');
            // Remove from local data
            this.allRequests = this.allRequests.filter(r => 
              this.getRequestId(r) !== requestId
            );
            this.updateDataSource();
            this.calculateStatistics();
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Error deleting request:', error);
            this.showSnackBar('Failed to delete request', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  // Helper method to update local request data
  private updateLocalRequest(requestId: number, updatedRequest: GDPRRequest): void {
    const index = this.allRequests.findIndex(r => 
      this.getRequestId(r) === requestId
    );
    if (index !== -1) {
      this.allRequests[index] = updatedRequest;
      this.updateDataSource();
      this.calculateStatistics();
    }
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
        this.selectedStatus = 'IN_PROGRESS';
        break;
      case 3:
        this.selectedStatus = 'COMPLETED';
        break;
      case 4:
        this.selectedStatus = 'REJECTED';
        break;
    }
    
    this.updateDataSource();
  }

  refreshData(): void {
    this.loadAllRequests();
    this.showSnackBar('Data refreshed', 'success');
  }

  viewDetails(request: GDPRRequest): void {
    const requestId = this.getRequestId(request);
    console.log('View details for request:', requestId, request);
    // Implement dialog for viewing full request details
  }

  viewUserHistory(request: GDPRRequest): void {
    const userEmail = this.getUserEmail(request);
    console.log('View user history for:', userEmail);
    // Navigate to user history or open dialog
  }

  exportRequest(request: GDPRRequest): void {
    const requestId = this.getRequestId(request);
    const data = {
      id: requestId,
      user: this.getUserName(request),
      email: this.getUserEmail(request),
      type: request.requestType,
      status: request.status,
      content: request.requestContent,
      company: this.getCompanyName(request),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `request-${requestId}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.showSnackBar('Request exported', 'success');
  }

  exportRequests(): void {
    const csvContent = this.convertToCSV(this.dataSource.filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gdpr-requests-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.showSnackBar('Requests exported successfully', 'success');
  }

  // Helper methods
  getUserName(request: GDPRRequest): string {
    if (request.user) {
      return `${request.user.firstname} ${request.user.lastname}`.trim() || 'Unknown User';
    }
    return `User #${request.userId}`;
  }

  getUserEmail(request: GDPRRequest): string {
    return request.user?.email || '';
  }

  getCompanyName(request: GDPRRequest): string {
    if (request.company) {
      return request.company.companyName || `Company #${request.companyId}`;
    }
    return `Company #${request.companyId}`;
  }

  getStatusIcon(status: string): string {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
      case 'EN_ATTENTE':
        return 'schedule';
      case 'IN_PROGRESS':
      case 'EN_COURS':
      case 'PROCESSING':
        return 'autorenew';
      case 'COMPLETED':
      case 'TERMINE':
      case 'APPROVED':
        return 'check_circle';
      case 'REJECTED':
      case 'REFUSE':
        return 'cancel';
      default:
        return 'help';
    }
  }

  getTypeIcon(type: string): string {
    const typeUpper = type.toUpperCase();
    switch (typeUpper) {
      case 'ACCESS':
        return 'visibility';
      case 'DELETION':
        return 'delete';
      case 'PORTABILITY':
        return 'import_export';
      case 'RECTIFICATION':
      case 'MODIFICATION':
        return 'edit';
      default:
        return 'assignment';
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  // Check if action is available based on status
  canValidate(request: GDPRRequest): boolean {
    const status = request.status.toUpperCase();
    return status === 'PENDING' || status === 'EN_ATTENTE' || status === 'IN_PROGRESS';
  }

  canReject(request: GDPRRequest): boolean {
    const status = request.status.toUpperCase();
    return status !== 'REJECTED' && status !== 'REFUSE';
  }

  canMarkInProgress(request: GDPRRequest): boolean {
    const status = request.status.toUpperCase();
    return status === 'PENDING' || status === 'EN_ATTENTE';
  }

  private convertToCSV(requests: GDPRRequest[]): string {
    const headers = ['ID', 'User', 'Email', 'Type', 'Status', 'Company', 'Created Date', 'Content'];
    const rows = requests.map(req => [
      this.getRequestId(req),
      this.getUserName(req),
      this.getUserEmail(req),
      this.requestService.getRequestTypeDisplayName(req.requestType),
      this.requestService.getStatusDisplayName(req.status),
      this.getCompanyName(req),
      new Date(req.createdAt).toLocaleDateString(),
      `"${req.requestContent.replace(/"/g, '""')}"`
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
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