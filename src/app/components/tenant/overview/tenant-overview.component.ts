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

  @Output() navigateTab = new EventEmitter<string>();

  onNavigate(tab: string) {
    this.navigateTab.emit(tab);
  }
}
