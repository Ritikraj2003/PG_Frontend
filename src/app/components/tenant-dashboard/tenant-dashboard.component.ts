import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/types';
import { PublicBrowserComponent } from '../public-browser/public-browser.component';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PublicBrowserComponent],
  templateUrl: './tenant-dashboard.component.html',
  styleUrl: './tenant-dashboard.component.css',
})
export class TenantDashboardComponent implements OnInit {
  @Input() user: User | null = null;

  private apiService = inject(ApiService);
  private router = inject(Router);

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
    const targetRoute = tab === 'overview' ? 'dashboard' : tab;
    this.router.navigate(['/tenant', targetRoute]);
  }

  private syncTabFromUrl() {
    const url = this.router.url;
    if (url.includes('/tenant/bookings')) this.activeTab = 'bookings';
    else if (url.includes('/tenant/invoices')) this.activeTab = 'invoices';
    else if (url.includes('/tenant/complaints')) this.activeTab = 'complaints';
    else if (url.includes('/tenant/explore')) this.activeTab = 'explore';
    else if (url.includes('/tenant/property')) this.activeTab = 'property';
    else if (url.includes('/tenant/overview') || url.includes('/tenant/dashboard')) this.activeTab = 'overview';
  }

  onLogout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/';
  }

  ngOnInit() {
    this.syncTabFromUrl();
    this.router.events.subscribe(() => {
      this.syncTabFromUrl();
    });

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

  showPaymentModal = false;
  selectedInvoice: any = null;
  paymentMethod: 'RAZORPAY' | 'MANUAL_QR' = 'RAZORPAY';
  branchSettings: any = null;
  screenshotFile: File | null = null;
  screenshotPreview: string | null = null;
  isPaying = false;
  
  apiUrl = 'http://localhost:5000'; // Or from environment

  async openPaymentModal(inv: any) {
    this.selectedInvoice = inv;
    this.paymentMethod = 'RAZORPAY';
    this.showPaymentModal = true;
    this.screenshotFile = null;
    this.screenshotPreview = null;
    if (inv.branch_id) {
      try {
        this.branchSettings = await this.apiService.tenant.getBranchSettings(inv.branch_id);
      } catch (err) {
        console.error('Could not load branch settings', err);
      }
    }
  }

  async openPaymentModalForBooking(bk: any) {
    const rent = Number(bk.monthly_rent) || 0;
    const deposit = Number(bk.security_deposit) || 0;
    
    this.selectedInvoice = {
      ...bk,
      isBooking: true,
      balance_amount: rent + deposit,
      billing_month: 'Initial Rent/Deposit',
      invoice_number: bk.booking_number
    };
    this.paymentMethod = 'RAZORPAY';
    this.showPaymentModal = true;
    this.screenshotFile = null;
    this.screenshotPreview = null;
    if (bk.branch_id) {
      try {
        this.branchSettings = await this.apiService.tenant.getBranchSettings(bk.branch_id);
      } catch (err) {
        console.error('Could not load branch settings', err);
      }
    }
  }
  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedInvoice = null;
  }

  onScreenshotSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.screenshotFile = file;
      const reader = new FileReader();
      reader.onload = () => this.screenshotPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  async loadRazorpayScript(): Promise<boolean> {
    if ((window as any).Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async processPayment() {
    if (!this.selectedInvoice) return;
    this.isPaying = true;

    try {
      if (this.paymentMethod === 'RAZORPAY') {
        const branchId = this.selectedInvoice.branch_id;
        const order = await this.apiService.payments.createRazorpayOrder(
          this.selectedInvoice.balance_amount,
          `inv_${this.selectedInvoice.invoice_number || Date.now()}`,
          branchId
        );

        const isLoaded = await this.loadRazorpayScript();
        const razorpayKey = order.key_id || this.branchSettings?.razorpay_key || 'rzp_test_default';

        if (isLoaded && (window as any).Razorpay) {
          const options = {
            key: razorpayKey,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'StayPulse PG',
            description: `Payment for ${this.selectedInvoice.billing_month || 'Rent/Deposit'}`,
            order_id: order.id,
            handler: async (response: any) => {
              try {
                await this.apiService.payments.verifyPayment({
                  razorpay_order_id: response.razorpay_order_id || order.id,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpay_signature: response.razorpay_signature || 'simulated_valid_signature',
                  rent_invoice_id: this.selectedInvoice.isBooking ? undefined : this.selectedInvoice.id,
                  booking_id: this.selectedInvoice.isBooking ? this.selectedInvoice.id : undefined,
                  amount: this.selectedInvoice.balance_amount,
                  payment_method: 'RAZORPAY',
                  branch_id: branchId,
                });
                alert(`🎉 Payment of ₹${this.selectedInvoice.balance_amount} completed successfully!`);
                this.closePaymentModal();
                this.fetchData();
              } catch (err: any) {
                alert(`Payment verification failed: ${err.message}`);
              } finally {
                this.isPaying = false;
              }
            },
            prefill: {
              name: this.user?.full_name || '',
              email: this.user?.email || '',
              contact: this.user?.mobile_number || '',
            },
            theme: {
              color: '#6366f1',
            },
            modal: {
              ondismiss: () => {
                this.isPaying = false;
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', (resp: any) => {
            alert(`Payment failed: ${resp.error?.description || 'Payment rejected'}`);
            this.isPaying = false;
          });
          rzp.open();
        } else {
          await this.apiService.payments.verifyPayment({
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: 'simulated_valid_signature',
            rent_invoice_id: this.selectedInvoice.isBooking ? undefined : this.selectedInvoice.id,
            booking_id: this.selectedInvoice.isBooking ? this.selectedInvoice.id : undefined,
            amount: this.selectedInvoice.balance_amount,
            payment_method: 'RAZORPAY_UPI',
            branch_id: branchId,
          });
          alert(`🎉 Payment of ₹${this.selectedInvoice.balance_amount} completed successfully!`);
          this.closePaymentModal();
          this.fetchData();
          this.isPaying = false;
        }
      } else {
        if (!this.screenshotFile) {
          alert('Please upload payment screenshot');
          this.isPaying = false;
          return;
        }
        const formData = new FormData();
        formData.append('branch_id', this.selectedInvoice.branch_id);
        if (this.selectedInvoice.isBooking) {
          formData.append('booking_id', this.selectedInvoice.id);
        } else {
          formData.append('invoice_id', this.selectedInvoice.id);
        }
        formData.append('amount', this.selectedInvoice.balance_amount.toString());
        formData.append('screenshot', this.screenshotFile);

        await this.apiService.tenant.submitManualPayment(formData);
        alert('Payment screenshot submitted for verification!');
        this.closePaymentModal();
        this.fetchData();
      }
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      this.isPaying = false;
    }
  }
}
