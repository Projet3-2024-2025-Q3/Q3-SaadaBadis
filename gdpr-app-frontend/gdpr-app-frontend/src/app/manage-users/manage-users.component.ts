// src/app/components/manage-users/manage-users.component.ts
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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Components
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar.component';

// Services
import { AdminService, User, CreateUserDTO, UpdateUserDTO } from '../services/admin.service';

// Delete Dialog Data Interface
interface DeleteDialogData {
  user: User;
}

@Component({
  selector: 'app-manage-users',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    AdminNavbarComponent
  ],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  displayedColumns: string[] = ['idUser', 'firstname', 'lastname', 'email', 'role', 'active', 'actions'];
  isLoading = true;
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all users
   */
  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.filteredUsers = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.showSnackBar('Error loading users: ' + error.message, 'error');
          this.isLoading = false;
        }
      });
  }

  /**
   * Filter users based on search term
   */
  applyFilter(): void {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      const roleToSearch = user.role?.roleName || user.role?.roleName || '';
      
      return user.firstname.toLowerCase().includes(searchLower) ||
             user.lastname.toLowerCase().includes(searchLower) ||
             user.email.toLowerCase().includes(searchLower) ||
             roleToSearch.toLowerCase().includes(searchLower);
    });
  }

  /**
   * Open create user dialog (external component)
   */
  openCreateDialog(): void {
    // This will open the external UserFormDialog component
    console.log('Opening create dialog - to be implemented with external component');
    // Example: this.dialog.open(UserFormDialogComponent, { data: { isEdit: false } });
  }

  /**
   * Open edit user dialog (external component)
   */
  openEditDialog(user: User): void {
    // This will open the external UserFormDialog component
    console.log('Opening edit dialog for user:', user);
    // Example: this.dialog.open(UserFormDialogComponent, { data: { user, isEdit: true } });
  }

  /**
   * Open delete confirmation dialog
   */
  openDeleteDialog(user: User): void {
    const dialogRef = this.dialog.open(DeleteUserDialogComponent, {
      width: '450px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user.idUser);
      }
    });
  }

  /**
   * Delete user
   */
  private deleteUser(userId: number): void {
    this.adminService.deleteUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove user from local arrays immediately
          this.removeUserFromArrays(userId);
          this.showSnackBar('User deleted successfully', 'success');
        },
        error: (error) => {
          this.showSnackBar('Cannot delete user: This user is linked to existing requests or companies. Please remove all associated data first.', 'error');
        }
      });
  }

  /**
   * Toggle user active status
   */
  toggleUserStatus(user: User): void {
    const action = user.active ? 'deactivate' : 'activate';
    const service = user.active ? 
      this.adminService.deactivateUser(user.idUser) : 
      this.adminService.activateUser(user.idUser);

    // Update UI immediately
    user.active = !user.active;

    service.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          // Update the user in the local arrays with server response
          this.updateUserInArrays(updatedUser);
          this.showSnackBar(`User ${action}d successfully`, 'success');
        },
        error: (error) => {
          // Revert the toggle state on error
          user.active = !user.active;
          this.showSnackBar(`Error ${action}ing user: ` + error.message, 'error');
        }
      });
  }

  /**
   * Update user in both users and filteredUsers arrays
   */
  private updateUserInArrays(updatedUser: User): void {
    // Update in main users array
    const userIndex = this.users.findIndex(u => u.idUser === updatedUser.idUser);
    if (userIndex !== -1) {
      this.users[userIndex] = updatedUser;
    }

    // Update in filtered users array
    const filteredIndex = this.filteredUsers.findIndex(u => u.idUser === updatedUser.idUser);
    if (filteredIndex !== -1) {
      this.filteredUsers[filteredIndex] = updatedUser;
    }
  }

  /**
   * Remove user from both arrays after deletion
   */
  private removeUserFromArrays(userId: number): void {
    // Remove from main users array
    this.users = this.users.filter(u => u.idUser !== userId);
    
    // Remove from filtered users array
    this.filteredUsers = this.filteredUsers.filter(u => u.idUser !== userId);
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: any): string {
    if (!role) return 'No Role';
    
    // Handle both nested role object and direct role property
    if (role.role) {
      return role.role;
    }
    
    return role.roleName || role.role || 'Unknown';
  }

  /**
   * Get role color class
   */
  getRoleColorClass(role: any): string {
    if (!role) return 'role-none';
    
    // Get role name from nested structure or direct property
    const roleName = (role.role || role.roleName || '').toLowerCase();
    
    switch (roleName) {
      case 'admin':
        return 'role-admin';
      case 'gerant':
      case 'manager':
        return 'role-manager';
      case 'client':
      case 'user':
        return 'role-client';
      default:
        return 'role-default';
    }
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

// Delete Confirmation Dialog Component (Internal)
@Component({
  selector: 'app-delete-user-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="warning-icon">warning</mat-icon>
      Confirm Deletion
    </h2>

    <mat-dialog-content>
      <div class="deletion-content">
        <div class="user-info">
          <mat-icon class="user-icon">person</mat-icon>
          <div class="user-details">
            <h3>{{ data.user.firstname }} {{ data.user.lastname }}</h3>
            <p class="user-email">{{ data.user.email }}</p>
            <span class="user-role">{{ data.user.role?.roleName || data.user.role?.roleName || 'No Role' }}</span>
          </div>
        </div>
        
        <div class="warning-message">
          <p class="warning-text">
            Are you sure you want to permanently delete this user?
          </p>
          <p class="warning-subtext">
            This action cannot be undone. If this user is linked to requests or companies, the deletion may fail.
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
        Delete User
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

    /* User Info Section */
    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #d32f2f;
    }

    .user-icon {
      font-size: 40px !important;
      width: 40px !important;
      height: 40px !important;
      color: #d32f2f;
      background: rgba(211, 47, 47, 0.1);
      border-radius: 50%;
      padding: 8px;
    }

    .user-details h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .user-email {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .user-role {
      display: inline-block;
      background: rgba(211, 47, 47, 0.1);
      color: #d32f2f;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
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
      
      .user-info {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
      
      .user-details h3 {
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
export class DeleteUserDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogData
  ) {}
}