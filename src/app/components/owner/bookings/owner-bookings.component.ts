import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-bookings.component.html',
  styleUrl: './owner-bookings.component.css'
})
export class OwnerBookingsComponent {
  @Input() bookings: any[] = [];
  @Output() updateStatus = new EventEmitter<{ id: string; status: string }>();

  showDetailsModal = false;
  selectedBooking: any = null;
  activeTab: 'profile' | 'kyc' | 'emergency' | 'financials' = 'profile';

  openViewModal(bk: any) {
    this.selectedBooking = bk;
    this.activeTab = 'profile';
    this.showDetailsModal = true;
  }

  closeViewModal() {
    this.showDetailsModal = false;
    this.selectedBooking = null;
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    return `http://localhost:5000${cleanPath}`;
  }
}
