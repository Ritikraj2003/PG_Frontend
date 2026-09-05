import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { OwnerSidebarComponent, OwnerTab } from '../sidebar/owner-sidebar.component';
import { OwnerRoomsComponent } from '../rooms/owner-rooms.component';
import { OwnerBookingsComponent } from '../bookings/owner-bookings.component';
import { OwnerInvoicesComponent } from '../invoices/owner-invoices.component';
import { OwnerExpensesComponent } from '../expenses/owner-expenses.component';
import { OwnerTenantsComponent } from '../tenants/owner-tenants.component';
import { OwnerSettingsComponent } from '../settings/owner-settings.component';
import { OwnerPaymentsComponent } from '../payments/owner-payments.component';
import { OwnerRolesComponent } from '../roles/owner-roles.component';
import { SubscriptionPlan } from '../../../models/types';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OwnerSidebarComponent,
    OwnerRoomsComponent,
    OwnerBookingsComponent,
    OwnerInvoicesComponent,
    OwnerPaymentsComponent,
    OwnerExpensesComponent,
    OwnerTenantsComponent,
    OwnerSettingsComponent,
    OwnerRolesComponent
  ],
  templateUrl: './owner-dashboard.component.html',
  styleUrl: './owner-dashboard.component.css',
})
export class OwnerDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  public authService = inject(AuthService);
  private router = inject(Router);

  dashboard: any = null;
  branches: any[] = [];
  selectedBranchId = '';

  rooms: any[] = [];
  bookings: any[] = [];
  invoices: any[] = [];
  expenses: any[] = [];
  tenants: any[] = [];

  activeTab: OwnerTab = 'dashboard';
  loadedTabs = new Set<string>();
  showRoomModal = false;

  subscription: any = null;
  isSubscriptionExpired = false;
  showRenewalModal = false;

  availablePlans: SubscriptionPlan[] = [];
  selectedPlanId = '';
  renewalMonths = 2;
  isRenewing = false;
  platformPaymentInfo: any = { razorpay_key: '', upi_id: '', upi_qr_url: '' };
  selectedPaymentMode: 'RAZORPAY' | 'UPI' | 'OFFLINE' = 'RAZORPAY';
  upiUtrNumber = '';
  apiUrl = environment.apiUrl || 'http://localhost:5000';
  renewalSuccessMessage = '';
  renewalErrorMessage = '';

  ngOnInit() {
    this.syncTabFromUrl();
    this.router.events.subscribe(() => {
      this.syncTabFromUrl();
    });
    this.fetchDashboard();
  }

  private syncTabFromUrl() {
    const url = this.router.url;
    const segments = url.split('?')[0].split('/');
    const lastSegment = segments[segments.length - 1];
    const validTabs: OwnerTab[] = ['dashboard', 'rooms', 'bookings', 'invoices', 'payments', 'expenses', 'tenants', 'settings', 'roles'];
    if (validTabs.includes(lastSegment as OwnerTab)) {
      if (this.activeTab !== lastSegment) {
        this.activeTab = lastSegment as OwnerTab;
        this.loadActiveTabData();
      }
    } else {
      this.activeTab = 'dashboard';
    }
  }

  async fetchDashboard() {
    try {
      const savedBranchId = sessionStorage.getItem('selected_branch_id');
      const [dash, plans] = await Promise.all([
        this.apiService.owner.getDashboard(savedBranchId || undefined),
        this.apiService.public.getPlans().catch(() => []),
      ]);
      this.dashboard = dash;
      this.availablePlans = plans || [];

      if (this.availablePlans.length > 0 && !this.selectedPlanId) {
        this.selectedPlanId = this.availablePlans[0].id;
        this.renewalMonths = this.availablePlans[0].duration_months;
      }
      
      if (this.dashboard?.subscription) {
        this.subscription = this.dashboard.subscription;
        this.isSubscriptionExpired = !!this.dashboard.subscription.is_expired || this.dashboard.subscription.status === 'EXPIRED';
        if (this.isSubscriptionExpired) {
          this.showRenewalModal = true;
          this.loadPlatformPaymentInfo();
        }
      }
      
      if (this.dashboard.branches && this.dashboard.branches.length > 0) {
        this.branches = this.dashboard.branches;
        const exists = this.branches.find((b: any) => b.id === savedBranchId);
        
        if (exists && savedBranchId) {
          this.selectedBranchId = savedBranchId;
        } else {
          this.selectedBranchId = this.branches[0].id;
        }

        // Save selected branch details into sessionStorage
        this.persistBranchInSession();

        // Load data for active tab
        await this.loadActiveTabData(true);
      }
    } catch (err) {
      console.error('Failed to fetch owner dashboard:', err);
    }
  }

  private persistBranchInSession() {
    if (!this.selectedBranchId) return;
    sessionStorage.setItem('selected_branch_id', this.selectedBranchId);
    
    const branchObj = this.branches.find((b: any) => b.id === this.selectedBranchId);
    if (branchObj) {
      sessionStorage.setItem('selected_branch_details', JSON.stringify(branchObj));
      sessionStorage.setItem('selected_branch', JSON.stringify(branchObj));
    }
  }

  async onBranchChange() {
    if (!this.selectedBranchId) return;
    
    // Save to session storage
    this.persistBranchInSession();

    // Fetch updated dashboard metrics specifically for the newly selected branch
    try {
      this.dashboard = await this.apiService.owner.getDashboard(this.selectedBranchId);
      if (this.dashboard?.subscription) {
        this.subscription = this.dashboard.subscription;
        this.isSubscriptionExpired = !!this.dashboard.subscription.is_expired || this.dashboard.subscription.status === 'EXPIRED';
        if (this.isSubscriptionExpired) {
          this.showRenewalModal = true;
        }
      } else {
        this.subscription = null;
        this.isSubscriptionExpired = true;
        this.showRenewalModal = true;
      }
    } catch (err) {
      console.error('Failed to refresh dashboard stats for branch:', err);
    }

    // Reset current tab data & force reload
    this.rooms = [];
    this.bookings = [];
    this.invoices = [];
    this.expenses = [];
    this.tenants = [];
    this.loadedTabs.clear();

    await this.loadActiveTabData(true);
  }

  setActiveTab(tab: OwnerTab) {
    this.activeTab = tab;
    this.router.navigate(['/owner', tab]);
    this.loadActiveTabData();
  }

  async loadActiveTabData(forceReload = false) {
    if (!this.selectedBranchId) return;
    try {
      if (this.activeTab === 'rooms' && (forceReload || !this.loadedTabs.has('rooms'))) {
        this.rooms = await this.apiService.owner.getRooms(this.selectedBranchId);
        this.loadedTabs.add('rooms');
      } else if (this.activeTab === 'bookings' && (forceReload || !this.loadedTabs.has('bookings'))) {
        this.bookings = await this.apiService.owner.getBookings(this.selectedBranchId);
        this.loadedTabs.add('bookings');
      } else if (this.activeTab === 'invoices' && (forceReload || !this.loadedTabs.has('invoices'))) {
        this.invoices = await this.apiService.owner.getRentInvoices(this.selectedBranchId);
        this.tenants = await this.apiService.owner.getTenants(this.selectedBranchId);
        this.loadedTabs.add('invoices');
      } else if (this.activeTab === 'expenses' && (forceReload || !this.loadedTabs.has('expenses'))) {
        this.expenses = await this.apiService.owner.getExpenses(this.selectedBranchId);
        this.loadedTabs.add('expenses');
      } else if (this.activeTab === 'tenants' && (forceReload || !this.loadedTabs.has('tenants'))) {
        this.tenants = await this.apiService.owner.getTenants(this.selectedBranchId);
        this.loadedTabs.add('tenants');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async handleUpdateBooking(event: { id: string; status: string }) {
    try {
      await this.apiService.owner.updateBookingStatus(event.id, event.status);
      alert('Booking status updated!');
      this.loadedTabs.delete('bookings');
      this.loadActiveTabData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }

  openRenewalModal() {
    this.showRenewalModal = true;
    this.loadPlatformPaymentInfo();
  }

  closeRenewalModal() {
    this.showRenewalModal = false;
  }

  selectRenewalPlan(plan: SubscriptionPlan) {
    this.selectedPlanId = plan.id;
    this.renewalMonths = plan.duration_months;
  }

  getSelectedPlanPrice(): number {
    const p = this.availablePlans.find(plan => plan.id === this.selectedPlanId);
    return p ? p.price : 0;
  }

  async loadPlatformPaymentInfo() {
    try {
      const res = await this.apiService.owner.getPlatformPaymentInfo();
      if (res) {
        this.platformPaymentInfo = res;
      }
    } catch (e) {
      console.warn('Could not load platform payment info:', e);
    }
  }

  copyUpiId() {
    if (this.platformPaymentInfo?.upi_id) {
      navigator.clipboard.writeText(this.platformPaymentInfo.upi_id);
      alert('SuperAdmin UPI ID copied to clipboard!');
    }
  }

  async payWithRazorpay() {
    const selectedPlan = this.availablePlans.find(p => p.id === this.selectedPlanId);
    if (!selectedPlan) {
      alert('Please select a subscription plan.');
      return;
    }

    try {
      this.isRenewing = true;

      // 1. Create Razorpay order on backend using SuperAdmin credentials
      const order = await this.apiService.owner.createSubscriptionOrder({
        amount: selectedPlan.price,
        plan_id: selectedPlan.id,
        branch_id: this.selectedBranchId,
      });

      if (!order) throw new Error('Could not initialize Razorpay order');

      // 2. Open Razorpay modal if window.Razorpay exists
      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: order.key_id || this.platformPaymentInfo.razorpay_key,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'StayPulse Platform Subscription',
          description: `${selectedPlan.name} (${selectedPlan.duration_months} Months)`,
          order_id: order.id,
          handler: async (response: any) => {
            try {
              // 3. Verify signature on backend & renew
              await this.apiService.owner.verifySubscriptionPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                branch_id: this.selectedBranchId,
                plan_id: selectedPlan.id,
                duration_months: selectedPlan.duration_months,
              });

              alert(`Payment successful! Branch subscription for ${selectedPlan.name} is now ACTIVE.`);
              this.showRenewalModal = false;
              this.isSubscriptionExpired = false;
              await this.fetchDashboard();
            } catch (vErr: any) {
              alert(`Payment verification failed: ${vErr.message}`);
            } finally {
              this.isRenewing = false;
            }
          },
          prefill: {
            name: this.dashboard?.owner?.full_name || '',
            email: this.dashboard?.owner?.email || '',
            contact: this.dashboard?.owner?.mobile_number || '',
          },
          theme: {
            color: '#7a422f',
          },
          modal: {
            ondismiss: () => {
              this.isRenewing = false;
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          alert(`Payment failed: ${resp.error?.description || 'Transaction cancelled'}`);
          this.isRenewing = false;
        });
        rzp.open();
      } else {
        // Fallback simulation if razorpay script isn't loaded or testing
        await this.apiService.owner.verifySubscriptionPayment({
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'simulated_valid_signature',
          branch_id: this.selectedBranchId,
          plan_id: selectedPlan.id,
          duration_months: selectedPlan.duration_months,
        });
        alert(`Payment verified! Branch subscription for ${selectedPlan.name} is now ACTIVE.`);
        this.showRenewalModal = false;
        this.isSubscriptionExpired = false;
        await this.fetchDashboard();
        this.isRenewing = false;
      }
    } catch (err: any) {
      console.error('Razorpay payment error:', err);
      alert(`Payment error: ${err.message || 'Payment failed'}`);
      this.isRenewing = false;
    }
  }

  async submitUpiRenewal() {
    const selectedPlan = this.availablePlans.find(p => p.id === this.selectedPlanId);
    if (!selectedPlan) {
      alert('Please select a subscription plan.');
      return;
    }
    if (!this.upiUtrNumber || this.upiUtrNumber.trim().length < 4) {
      alert('Please enter a valid 12-digit UPI UTR or Transaction Reference number.');
      return;
    }

    try {
      this.isRenewing = true;
      await this.apiService.owner.renewSubscription({
        branch_id: this.selectedBranchId,
        plan_id: selectedPlan.id,
        duration_months: selectedPlan.duration_months,
        payment_method: 'UPI',
        transaction_id: this.upiUtrNumber.trim(),
        payment_status: 'PAID',
      });
      alert(`UPI Payment recorded! Branch subscription for ${selectedPlan.name} is now ACTIVE.`);
      this.showRenewalModal = false;
      this.isSubscriptionExpired = false;
      this.upiUtrNumber = '';
      await this.fetchDashboard();
    } catch (err: any) {
      alert(`Renewal failed: ${err.message}`);
    } finally {
      this.isRenewing = false;
    }
  }

  async submitOfflineRenewal() {
    const selectedPlan = this.availablePlans.find(p => p.id === this.selectedPlanId);
    if (!selectedPlan) {
      alert('Please select a subscription plan.');
      return;
    }
    if (confirm(`Confirm subscription request for ${selectedPlan.name} (₹${selectedPlan.price}) via Cash / Offline settlement?`)) {
      try {
        this.isRenewing = true;
        await this.apiService.owner.renewSubscription({
          branch_id: this.selectedBranchId,
          plan_id: selectedPlan.id,
          duration_months: selectedPlan.duration_months,
          payment_method: 'CASH',
          transaction_id: `OFFLINE_${Date.now()}`,
          payment_status: 'PENDING',
        });
        alert('Offline subscription request recorded! Admin has been notified.');
        this.showRenewalModal = false;
        await this.fetchDashboard();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      } finally {
        this.isRenewing = false;
      }
    }
  }

  async renewPlan() {
    if (this.selectedPaymentMode === 'RAZORPAY') {
      return this.payWithRazorpay();
    } else if (this.selectedPaymentMode === 'UPI') {
      return this.submitUpiRenewal();
    } else {
      return this.submitOfflineRenewal();
    }
  }

  handleLogout() {
    this.authService.logout();
  }
}
