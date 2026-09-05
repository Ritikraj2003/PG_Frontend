import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

export type OwnerTab = 'dashboard' | 'rooms' | 'bookings' | 'invoices' | 'payments' | 'expenses' | 'tenants' | 'settings' | 'roles';

@Component({
  selector: 'app-owner-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-sidebar.component.html',
  styleUrl: './owner-sidebar.component.css'
})
export class OwnerSidebarComponent {
  public authService = inject(AuthService);

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

  get isOwner(): boolean {
    const user = this.authService.currentUser;
    return Boolean(user?.roles?.includes('COMPANY_ADMIN') || user?.roles?.includes('SUPER_ADMIN') || user?.is_owner);
  }

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  onTabClick(tab: OwnerTab) {
    this.selectTab.emit(tab);
    this.isMobileOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.isMobileOpen = false;
  }
}
