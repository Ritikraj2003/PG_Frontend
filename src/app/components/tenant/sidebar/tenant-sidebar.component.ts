import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-sidebar.component.html',
  styleUrl: './tenant-sidebar.component.css',
})
export class TenantSidebarComponent {
  @Input() activeTab: string = 'overview';
  @Input() bookingsCount: number = 0;
  @Input() invoicesCount: number = 0;
  @Input() complaintsCount: number = 0;

  @Output() selectTab = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  onSelectTab(tab: string) {
    this.selectTab.emit(tab);
  }

  onLogout() {
    this.logout.emit();
  }

  onCloseMobile() {
    this.closeMobile.emit();
  }
}
