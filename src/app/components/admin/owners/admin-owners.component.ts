import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-owners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-owners.component.html',
  styleUrl: './admin-owners.component.css'
})
export class AdminOwnersComponent {
  @Input() owners: any[] = [];

  @Output() registerOwner = new EventEmitter<void>();
  @Output() viewOwner = new EventEmitter<any>();
  @Output() editOwner = new EventEmitter<any>();
  @Output() addBranch = new EventEmitter<any>();
  @Output() deleteOwner = new EventEmitter<any>();
  @Output() renewOwner = new EventEmitter<any>();

  searchQuery: string = '';
  statusFilter: string = 'ALL';

  get filteredOwners(): any[] {
    if (!this.owners) return [];
    return this.owners.filter(o => {
      const q = this.searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        (o.full_name && o.full_name.toLowerCase().includes(q)) ||
        (o.business_name && o.business_name.toLowerCase().includes(q)) ||
        (o.property_name && o.property_name.toLowerCase().includes(q)) ||
        (o.owner_code && o.owner_code.toLowerCase().includes(q)) ||
        (o.contact_number && o.contact_number.includes(q)) ||
        (o.mobile_number && o.mobile_number.includes(q)) ||
        (o.city && o.city.toLowerCase().includes(q));

      const isExpired = o.is_expired || o.subscription_status === 'EXPIRED' || (o.days_remaining <= 0);
      const matchesStatus = this.statusFilter === 'ALL' ||
        (this.statusFilter === 'ACTIVE' && !isExpired) ||
        (this.statusFilter === 'EXPIRED' && isExpired);

      return matchesSearch && matchesStatus;
    });
  }
}

