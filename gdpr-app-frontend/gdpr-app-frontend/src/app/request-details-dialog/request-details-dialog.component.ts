// src/app/components/request-details-dialog/request-details-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-request-details-dialog',
  standalone: true, // Standalone component - doesn't need NgModule
  imports: [
    CommonModule,
    MatDialogModule,    // Material dialog functionality
    MatButtonModule,    // Material buttons
    MatIconModule,      // Material icons
    MatDividerModule,   // Material dividers for visual separation
    MatChipsModule      // Material chips for status/type display
  ],
  templateUrl: './request-details-dialog.component.html',
  styleUrls: ['./request-details-dialog.component.css']
})
export class RequestDetailsDialogComponent {
  request: any;           // The GDPR request data to display
  companyName: string;    // Company name associated with the request
  userRole: string;       // User role to determine UI styling and permissions

  constructor(
    // MatDialogRef allows us to control the dialog (close, return data, etc.)
    public dialogRef: MatDialogRef<RequestDetailsDialogComponent>,
    // @Inject decorator to receive data passed when opening the dialog
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Extract data from the injected dialog data
    this.request = data.request;
    this.companyName = data.companyName;
    this.userRole = data.userRole || 'CLIENT'; // Default to CLIENT if no role provided
  }

  /**
   * Get request ID with fallback for different property names
   * Handles different API response formats
   */
  getRequestId(): string {
    return this.request.idRequest || this.request.id;
  }

  /**
   * Get appropriate Material icon based on request status
   * Provides visual indicators for different status types
   */
  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'schedule';      // Clock icon for pending requests
      case 'COMPLETED':
      case 'PROCESSED':
        return 'check_circle';  // Checkmark for completed requests
      default:
        return 'help';          // Question mark for unknown status
    }
  }

  /**
   * Get appropriate icon for request type
   * Visual differentiation between request types
   */
  getTypeIcon(type: string): string {
    return type === 'MODIFICATION' ? 'edit' : 'delete';
  }

  /**
   * Format date string for user-friendly display
   * Converts ISO date string to readable format
   */
  formatDate(date: string): string {
    if (!date) return 'N/A'; // Handle null/undefined dates
    
    const d = new Date(date);
    // Format: "January 15, 2024 at 2:30 PM"
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get header styling based on user role
   * Different colors for different user types (Manager vs Client)
   */
  getHeaderStyle(): any {
    return {
      // Manager gets green gradient, others get blue/purple gradient
      'background': this.userRole === 'GERANT'
        ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' // Green gradient for managers
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Blue/purple gradient for others
      'color': 'white',
      'padding': '20px',
      'border-radius': '10px 10px 0 0', // Rounded top corners only
      'margin': '-24px -24px 0 -24px'   // Negative margin to extend to dialog edges
    };
  }

  /**
   * Close the dialog without returning any data
   */
  close(): void {
    this.dialogRef.close();
  }
}