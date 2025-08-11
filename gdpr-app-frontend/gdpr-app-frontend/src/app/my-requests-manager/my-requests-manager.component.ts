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
  
  // Table columns - Removed select, date and actions columns
  displayedColumns: string[] = ['id', 'user', 'requestType', 'company', 'status'];
  
  // Filter properties - Kept minimal
  selectedStatus: string = 'all';
  selectedType: string = 'all';
  
  // Statistics - Only total and pending
  statistics = {
    total: 0,
    pending: 0
  };
  
  // UI State
  isLoading: boolean = true;
  isProcessing: boolean = false;
  selectedTab: number = 0;
  
  // Status options - Only all and pending
  statusOptions = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' }
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

    this.dataSource.data = filteredData;
  }

  calculateStatistics(): void {
    this.statistics = {
      total: this.allRequests.length,
      pending: this.allRequests.filter(r => 
        r.status === 'PENDING' || r.status === 'EN_ATTENTE'
      ).length
    };
  }

  // Helper method to get request ID (handles both id and idGdprRequest)
  private getRequestId(request: GDPRRequest): number {
    return request.id;
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
    }
    
    this.updateDataSource();
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

  private convertToCSV(requests: GDPRRequest[]): string {
    const headers = ['ID', 'User', 'Email', 'Type', 'Status', 'Company', 'Content'];
    const rows = requests.map(req => [
      this.getRequestId(req),
      this.getUserName(req),
      this.getUserEmail(req),
      this.requestService.getRequestTypeDisplayName(req.requestType),
      this.requestService.getStatusDisplayName(req.status),
      this.getCompanyName(req),
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