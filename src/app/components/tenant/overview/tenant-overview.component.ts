import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-overview.component.html',
  styleUrl: './tenant-overview.component.css',
})
export class TenantOverviewComponent {
  @Input() currentProperty: any = null;
  @Input() currentRoom: any = null;
  @Input() invoices: any[] = [];
  @Input() complaints: any[] = [];

  @Output() navigateTab = new EventEmitter<string>();

  get activeComplaintsCount(): number {
    if (!this.complaints || this.complaints.length === 0) return 0;
    return this.complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  }

  onNavigate(tab: string) {
    this.navigateTab.emit(tab);
  }
}
