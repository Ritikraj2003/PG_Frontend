import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  onPayBooking(bk: any) {
    this.payBooking.emit(bk);
  }
}
