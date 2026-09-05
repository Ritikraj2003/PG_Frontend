import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-property',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-property.component.html',
  styleUrl: './tenant-property.component.css',
})
export class TenantPropertyComponent {
  @Input() currentProperty: any = null;
  @Input() currentRoom: any = null;
  @Input() currentBooking: any = null;
  @Input() currentTenantCode: string = '';

  @Output() navigateTab = new EventEmitter<string>();
  @Output() openComplaint = new EventEmitter<void>();

  onNavigate(tab: string) {
    this.navigateTab.emit(tab);
  }

  onOpenComplaint() {
    this.openComplaint.emit();
  }
}
