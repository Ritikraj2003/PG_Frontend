import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-owner-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-invoices.component.html',
  styleUrl: './owner-invoices.component.css'
})
export class OwnerInvoicesComponent {
  private apiService = inject(ApiService);

  @Input() invoices: any[] = [];
  @Input() branchId: string = '';
  @Input() tenants: any[] = [];
  @Output() refresh = new EventEmitter<void>();

  showModal = false;
  isSubmitting = false;
  errorMessage = '';

  newInvoice = {
    tenant_id: '',
    billing_month: new Date().toISOString().slice(0, 7),
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    rent_amount: 0,
    maintenance_amount: 500,
    electricity_amount: 300,
    water_amount: 0,
    food_amount: 0,
    other_amount: 0
  };

  get totalBilled(): number {
    return this.invoices.reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0);
  }

  get totalCollected(): number {
    return this.invoices.reduce((acc, inv) => acc + Number(inv.paid_amount || 0), 0);
  }

  get totalPending(): number {
    return this.invoices.reduce((acc, inv) => acc + Number(inv.balance_amount || 0), 0);
  }

  openCreateModal() {
    this.showModal = true;
    this.errorMessage = '';
    if (this.tenants.length > 0) {
      this.newInvoice.tenant_id = this.tenants[0].id;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  async submitInvoice() {
    if (!this.branchId) {
      this.errorMessage = 'Please select a branch first';
      return;
    }
    if (!this.newInvoice.tenant_id) {
      this.errorMessage = 'Please select a tenant';
      return;
    }
    if (this.newInvoice.rent_amount <= 0) {
      this.errorMessage = 'Rent amount must be greater than 0';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.apiService.owner.createRentInvoice({
        ...this.newInvoice,
        branch_id: this.branchId
      });
      this.closeModal();
      this.refresh.emit();
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to generate invoice';
    } finally {
      this.isSubmitting = false;
    }
  }
}
