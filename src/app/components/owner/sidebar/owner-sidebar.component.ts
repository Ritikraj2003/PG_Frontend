import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type OwnerTab = 'dashboard' | 'rooms' | 'bookings' | 'invoices' | 'payments' | 'expenses' | 'tenants' | 'settings';

@Component({
  selector: 'app-owner-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-sidebar.component.html',
  styleUrl: './owner-sidebar.component.css'
})
export class OwnerSidebarComponent {
  @Input() activeTab: OwnerTab = 'rooms';
  @Input() loadedTabs: Set<string> = new Set<string>();
  @Input() roomsCount: number = 0;
  @Input() bookingsCount: number = 0;
  @Input() invoicesCount: number = 0;
  @Input() expensesCount: number = 0;
  @Input() tenantsCount: number = 0;

  @Output() selectTab = new EventEmitter<OwnerTab>();
  @Output() logout = new EventEmitter<void>();

  isMobileOpen = false;

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  onTabClick(tab: OwnerTab) {
    this.selectTab.emit(tab);
    this.isMobileOpen = false; // close drawer on mobile after selection
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.isMobileOpen = false;
  }
}
