// src/app/components/manager-requests/manager-requests.component.ts
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

// Components
import { ManagerNavbarComponent } from '../manager-navbar/manager-navbar.component';

// Services
import { AuthService, UserInfo } from '../services/auth.service';
import { RequestService, GDPRRequest, UpdateStatusDTO } from '../services/request.service';

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
  
  // Table columns
  displayedColumns: string[] = ['id', 'user', 'requestType', 'company', 'date', 'status', 'actions'];
  
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
    rejected: 0
  };
  
  // UI State
  isLoading: boolean = true;
  selectedTab: number = 0;
  
  // Status options
  statusOptions = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' },
    { value: 'COMPLETED', label: 'Completed', icon: 'check_circle' },
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
    // Check if user is manager
    if (!this.authService.isManager()) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
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
    
    // For manager, we need to get ALL requests, not just user's own
    // This will require a manager/admin endpoint - for now using the same service
    this.requestService.getMyRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
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
    this.selectedDateRange = 'all';
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
      case 3:
        this.selectedStatus = 'REJECTED';
        break;
    }
    
    this.updateDataSource();
  }

  refreshData(): void {
    this.loadAllRequests();
    this.showSnackBar('Data refreshed', 'success');
  }

  // Actions
  viewDetails(request: GDPRRequest): void {
    // Open detail view or dialog
    console.log('View details for request:', request);
    // You can implement a dialog similar to the client version
  }

  markAsCompleted(request: GDPRRequest): void {
    if (confirm(`Mark request #${request.id} as completed?`)) {
      const updateData: UpdateStatusDTO = { status: 'COMPLETED' };
      
      // This would require a manager endpoint to update status
      // For now, showing the intended action
      console.log('Marking as completed:', request.id);
      this.showSnackBar(`Request #${request.id} marked as completed`, 'success');
      
      // Update local data
      request.status = 'COMPLETED';
      this.calculateStatistics();
      this.updateDataSource();
    }
  }

  rejectRequest(request: GDPRRequest): void {
    const reason = prompt(`Enter rejection reason for request #${request.id}:`);
    if (reason) {
      const updateData: UpdateStatusDTO = { status: 'REJECTED' };
      
      console.log('Rejecting request:', request.id, 'Reason:', reason);
      this.showSnackBar(`Request #${request.id} rejected`, 'info');
      
      // Update local data
      request.status = 'REJECTED';
      this.calculateStatistics();
      this.updateDataSource();
    }
  }

  deleteRequest(request: GDPRRequest): void {
    if (confirm(`Are you sure you want to delete request #${request.id}?`)) {
      this.requestService.deleteRequest(request.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackBar(`Request #${request.id} deleted successfully`, 'success');
            this.loadAllRequests();
          },
          error: (error) => {
            console.error('Error deleting request:', error);
            this.showSnackBar('Failed to delete request', 'error');
          }
        });
    }
  }

  viewUserHistory(request: GDPRRequest): void {
    console.log('View user history for:', this.getUserEmail(request));
    // Navigate to user history or open dialog
  }

  exportRequest(request: GDPRRequest): void {
    const data = {
      id: request.id,
      user: this.getUserName(request),
      email: this.getUserEmail(request),
      type: request.requestType,
      status: request.status,
      content: request.requestContent,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `request-${request.id}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
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
      return request.company.name || `Company #${request.companyId}`;
    }
    return `Company #${request.companyId}`;
  }

  getStatusIcon(status: string): string {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
      case 'EN_ATTENTE':
        return 'schedule';
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

  private convertToCSV(requests: GDPRRequest[]): string {
    const headers = ['ID', 'User', 'Email', 'Type', 'Status', 'Company', 'Created Date', 'Content'];
    const rows = requests.map(req => [
      req.id,
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