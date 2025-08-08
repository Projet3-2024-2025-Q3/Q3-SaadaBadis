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
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './request-details-dialog.component.html',
  styleUrls: ['./request-details-dialog.component.css']
})
export class RequestDetailsDialogComponent {
  request: any;
  companyName: string;

  constructor(
    public dialogRef: MatDialogRef<RequestDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.request = data.request;
    this.companyName = data.companyName;
  }

  getRequestId(): string {
    return this.request.idRequest || this.request.id;
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

  getTypeIcon(type: string): string {
    return type === 'MODIFICATION' ? 'edit' : 'delete';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}