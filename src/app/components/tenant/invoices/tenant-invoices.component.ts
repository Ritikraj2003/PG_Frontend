import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-invoices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-invoices.component.html',
  styleUrl: './tenant-invoices.component.css',
})
export class TenantInvoicesComponent {
  @Input() invoices: any[] = [];
  @Output() payInvoice = new EventEmitter<any>();

  onPayInvoice(inv: any) {
    this.payInvoice.emit(inv);
  }
}
