import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-bookings.component.html',
  styleUrl: './tenant-bookings.component.css',
})
export class TenantBookingsComponent {
  @Input() bookings: any[] = [];
  @Output() payBooking = new EventEmitter<any>();

  selectedBooking: any = null;
  showDetailsModal = false;

  onPayBooking(bk: any) {
    this.payBooking.emit(bk);
  }

  openBookingDetails(bk: any) {
    this.selectedBooking = bk;
    this.showDetailsModal = true;
  }

  closeBookingDetails() {
    this.selectedBooking = null;
    this.showDetailsModal = false;
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${cleanPath}`;
  }
}
