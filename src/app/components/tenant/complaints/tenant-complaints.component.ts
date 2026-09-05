import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-complaints',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-complaints.component.html',
  styleUrl: './tenant-complaints.component.css',
})
export class TenantComplaintsComponent {
  @Input() complaints: any[] = [];
  @Output() openModal = new EventEmitter<void>();

  onOpenModal() {
    this.openModal.emit();
  }
}
