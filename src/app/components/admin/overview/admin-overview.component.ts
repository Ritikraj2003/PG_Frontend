import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css'
})
export class AdminOverviewComponent {
  @Input() reports: any = null;
  @Input() owners: any[] = [];
  @Input() properties: any[] = [];
  @Input() branches: any[] = [];

  @Output() viewAllOwners = new EventEmitter<void>();
  @Output() viewOwner = new EventEmitter<any>();
  @Output() editOwner = new EventEmitter<any>();
}
