import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/types';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-dashboard.component.html',
  styleUrl: './tenant-dashboard.component.css',
})
export class TenantDashboardComponent implements OnInit {
  @Input() user: User | null = null;

  private apiService = inject(ApiService);

  dashboard: any = null;
  bookings: any[] = [];
  invoices: any[] = [];
  complaints: any[] = [];

  activeTab: string = 'overview';
  showComplaintModal = false;

  newComplaint = {
    title: '',
    category: 'MAINTENANCE',
    priority: 'MEDIUM',
    description: '',
  };

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onLogout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/';
  }

  ngOnInit() {
    if (!this.user) {
      const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch (e) {}
      }
    }
    this.fetchData();
  }

  async fetchData() {
    try {
      this.dashboard = await this.apiService.tenant.getDashboard();
      this.bookings = await this.apiService.tenant.getBookings();
      this.invoices = await this.apiService.tenant.getInvoices();
      this.complaints = await this.apiService.tenant.getComplaints();
    } catch (err) {
      console.error(err);
    }
  }

  openComplaintModal() {
    this.newComplaint = {
      title: '',
      category: 'MAINTENANCE',
      priority: 'MEDIUM',
      description: '',
    };
    this.showComplaintModal = true;
  }

  async submitComplaint() {
    try {
      if (!this.newComplaint.title || !this.newComplaint.description) {
        alert('Please fill in complaint title and description.');
        return;
      }
      await this.apiService.tenant.createComplaint(this.newComplaint);
      alert('Complaint ticket raised successfully!');
      this.showComplaintModal = false;
      this.fetchData();
    } catch (err: any) {
      alert(`Error submitting complaint: ${err.message}`);
    }
  }

  async payInvoice(inv: any) {
    try {
      const order = await this.apiService.payments.createRazorpayOrder(inv.balance_amount, `inv_${inv.invoice_number}`);
      await this.apiService.payments.verifyPayment({
        razorpay_order_id: order.id,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: 'simulated_valid_signature',
        rent_invoice_id: inv.id,
        amount: inv.balance_amount,
        payment_method: 'RAZORPAY_UPI',
      });
      alert(`🎉 Payment of ₹${inv.balance_amount} completed successfully!`);
      this.fetchData();
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    }
  }
}
