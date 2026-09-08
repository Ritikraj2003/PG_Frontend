import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { SubscriptionPlan } from '../../../models/types';
import { getInstantUpiQrUrl } from '../../../utils/upi-qr.util';
import { environment } from '../../../../environments/environment';
import { AdminSidebarComponent } from '../sidebar/admin-sidebar.component';
import { AdminOverviewComponent } from '../overview/admin-overview.component';
import { AdminOwnersComponent } from '../owners/admin-owners.component';
import { AdminPropertiesComponent } from '../properties/admin-properties.component';
import { AdminBranchesComponent } from '../branches/admin-branches.component';
import { AdminPlansComponent } from '../plans/admin-plans.component';
import { AdminReportsComponent } from '../reports/admin-reports.component';
import { AdminSettingsComponent } from '../settings/admin-settings.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    AdminOverviewComponent,
    AdminOwnersComponent,
    AdminPropertiesComponent,
    AdminBranchesComponent,
    AdminPlansComponent,
    AdminReportsComponent,
    AdminSettingsComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  reports: any = null;
  owners: any[] = [];
  properties: any[] = [];
  branches: any[] = [];
  plans: SubscriptionPlan[] = [];

  selectedOwner: any = null;
  selectedOwnerBranches: any[] = [];

  showCreateOwnerModal = false;
  showViewModal = false;
  showEditOwnerModal = false;
  showEditBranchModal = false;
  showAddBranchModal = false;
  selectedOwnerForBranch: any = null;
  isBranchCoveredByPlan = false;
  createBranchStep: number = 1;
  showRenewModal = false;
  showPlanModal = false;
  isEditingPlan = false;
  showRenewBranchModal = false;
  isProcessingPayment: boolean = false;
  isSubmittingOwner: boolean = false;

  renewOwnerData: any = null;
  renewMonths: number = 2;

  renewBranchData: any = null;
  renewBranchPlanId: string = '';

  planFormData = {
    id: '',
    name: '',
    duration_months: 2,
    price: 1999,
    max_branches: 1,
    is_active: true,
    featuresText: 'Full PMS Access, Multi-branch Management, Auto Invoicing',
  };

  ownerData = {
    full_name: '',
    email: '',
    mobile_number: '',
    password: 'owner123',
    owner_code: '',
    business_name: '',
    contact_number: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    property_type: 'PG',
    property_name: '',
    logo: '',
    description: '',
    kyc_doc_type: 'Aadhaar Card',
    kyc_doc_number: '',
    kyc_doc_url: '',
    subscription_months: 2,
    plan_id: '',
    plan_name: 'Starter (2 Months)',
    payment_mode: 'CASH',
    payment_status: 'PAID',
    payment_ref: '',
  };

  editOwnerData = {
    id: '',
    full_name: '',
    business_name: '',
    email: '',
    contact_number: '',
    address: '',
    city: 'Bengaluru',
    property_name: '',
    property_type: 'PG',
  };

  editBranchData = {
    id: '',
    branch_name: '',
    address: '',
    city: '',
    contact_number: '',
  };

  branchData = {
    property_id: '',
    branch_name: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    contact_number: '',
    latitude: 12.9352,
    longitude: 77.6245,
    pg_type: 'UNISEX',
    starting_monthly_rent: 8000,
    plan_id: '',
    payment_mode: 'CASH',
    payment_status: 'PAID',
    payment_ref: '',
  };

  detectBranchLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.branchData.latitude = Number(pos.coords.latitude.toFixed(6));
          this.branchData.longitude = Number(pos.coords.longitude.toFixed(6));
          alert(`Detected GPS Coordinates: ${this.branchData.latitude}, ${this.branchData.longitude}`);
        },
        () => alert('Could not automatically retrieve GPS location. Please enter coordinates manually.')
      );
    }
  }

  renewBranchPaymentMode: string = 'CASH';
  renewBranchPaymentStatus: string = 'PAID';
  renewBranchPaymentRef: string = '';

    generalSettings: any = {
    id: '',
    branch_id: null,
    razorpay_key: '',
    razorpay_secret: '',
    upi_id: '',
    upi_qr_url: '',
    smtp_email: '',
    smtp_password: '',
  };
  generalSettingsLoading: boolean = false;
  generalSettingsSaving: boolean = false;
  generalSettingsSuccess: string = '';
  generalSettingsError: string = '';
  qrFile: File | null = null;
  qrPreview: string | null = null;
  apiUrl: string = environment.apiUrl || 'http://localhost:5000';
  showRazorpaySecret: boolean = false;
  showSmtpPassword: boolean = false;
  copiedUpi: boolean = false;

  copyUpiId(id: string) {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      this.copiedUpi = true;
      setTimeout(() => {
        this.copiedUpi = false;
      }, 2000);
    }).catch(() => {});
  }

  activeTab: string = 'overview';
  isMobileSidebarOpen: boolean = false;

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen = false;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.closeMobileSidebar();
    const targetRoute = tab === 'overview' ? 'dashboard' : tab;
    this.router.navigate(['/admin', targetRoute]);
  }

  private syncTabFromUrl() {
    const url = this.router.url;
    if (url.includes('/admin/owners')) this.activeTab = 'owners';
    else if (url.includes('/admin/properties')) this.activeTab = 'properties';
    else if (url.includes('/admin/branches')) this.activeTab = 'branches';
    else if (url.includes('/admin/plans')) this.activeTab = 'plans';
    else if (url.includes('/admin/users')) this.activeTab = 'users';
    else if (url.includes('/admin/reports')) this.activeTab = 'reports';
    else if (url.includes('/admin/settings') || url.includes('/admin/generalsetting')) {
      this.activeTab = 'settings';
    }
    else if (url.includes('/admin/overview') || url.includes('/admin/dashboard')) this.activeTab = 'overview';
  }

  onLogout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/';
  }

  ngOnInit() {
    this.syncTabFromUrl();
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.syncTabFromUrl();
    });
    this.fetchData();
  }

  async fetchData() {
    try {
      const [reportsData, ownersData, propertiesData, branchesData, plansData] = await Promise.all([
        this.apiService.admin.getReports().catch(() => null),
        this.apiService.admin.getOwners().catch(() => []),
        this.apiService.admin.getProperties().catch(() => []),
        this.apiService.admin.getBranches().catch(() => []),
        this.apiService.admin.getPlans().catch(() => []),
      ]);
      this.reports = reportsData;
      this.owners = ownersData;
      this.properties = propertiesData;
      this.branches = branchesData;
      this.plans = plansData || [];

      if (this.selectedOwner) {
        const freshOwner = this.owners.find(o => o.id === this.selectedOwner.id);
        if (freshOwner) {
          this.selectedOwner = freshOwner;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  logoFileName = '';
  kycFileName = '';
  selectedLogoFile: File | null = null;
  selectedKycFile: File | null = null;

  onLogoFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.logoFileName = file.name;
      this.selectedLogoFile = file;
    }
  }

  onKycFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.kycFileName = file.name;
      this.selectedKycFile = file;
    }
  }

  // --- CREATE OWNER ---
  openCreateOwnerModal() {
    this.createOwnerStep = 1;
    this.logoFileName = '';
    this.kycFileName = '';
    this.selectedLogoFile = null;
    this.selectedKycFile = null;
    this.isProcessingPayment = false;
    this.isSubmittingOwner = false;

    // Preload general settings for platform UPI and Razorpay credentials
    this.loadGeneralSettings();

    const defaultPlan = this.plans.length > 0 ? this.plans[0] : null;

    this.ownerData = {
      full_name: '',
      email: '',
      mobile_number: '',
      password: 'owner123',
      owner_code: '',
      business_name: '',
      contact_number: '',
      address: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '',
      property_type: 'PG',
      property_name: '',
      logo: '',
      description: '',
      kyc_doc_type: 'Aadhaar Card',
      kyc_doc_number: '',
      kyc_doc_url: '',
      subscription_months: defaultPlan ? defaultPlan.duration_months : 2,
      plan_id: defaultPlan ? defaultPlan.id : '',
      plan_name: defaultPlan ? defaultPlan.name : 'Starter (2 Months)',
      payment_mode: 'RAZORPAY',
      payment_status: 'PAID',
      payment_ref: '',
    };
    this.showCreateOwnerModal = true;
  }

  getSelectedPlan(planId?: string): SubscriptionPlan | undefined {
    const id = planId || this.ownerData.plan_id;
    return this.plans.find(p => p.id === id);
  }

  onPlanSelectChange(planId: string) {
    const plan = this.plans.find(p => p.id === planId);
    if (plan) {
      this.ownerData.plan_id = plan.id;
      this.ownerData.plan_name = plan.name;
      this.ownerData.subscription_months = plan.duration_months;
    }
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  
  createOwnerStep: number = 1;

  nextOwnerStep() {
    if (this.createOwnerStep === 1) {
      if (!this.ownerData.full_name || !this.ownerData.email || !this.ownerData.mobile_number) {
        alert('Please fill in Full Name, Email, and Mobile Number.');
        return;
      }
    } else if (this.createOwnerStep === 2) {
      if (!this.ownerData.business_name) {
        alert('Please enter Business / PG Brand Name.');
        return;
      }
    } else if (this.createOwnerStep === 3) {
      if (!this.ownerData.city || !this.ownerData.address) {
        alert('Please enter City and Address.');
        return;
      }
    }
    if (this.createOwnerStep < 5) {
      this.createOwnerStep++;
    }
  }

  prevOwnerStep() {
    if (this.createOwnerStep > 1) {
      this.createOwnerStep--;
    }
  }

  goToOwnerStep(step: number) {
    if (step < this.createOwnerStep) {
      this.createOwnerStep = step;
    } else if (step === this.createOwnerStep + 1) {
      this.nextOwnerStep();
    }
  }

  selectPlan(planOrMonths: any) {
    if (typeof planOrMonths === 'number') {
      const matched = this.plans.find(p => p.duration_months === planOrMonths);
      if (matched) {
        this.selectPlan(matched);
        return;
      }
      this.ownerData.subscription_months = planOrMonths;
      this.ownerData.plan_name =
        planOrMonths === 12 ? 'Annual (12 Months)' :
        planOrMonths === 6 ? 'Half-Yearly (6 Months)' :
        planOrMonths === 3 ? 'Quarterly (3 Months)' :
        'Starter (2 Months)';
      return;
    }
    this.ownerData.plan_id = planOrMonths.id;
    this.ownerData.plan_name = planOrMonths.name;
    this.ownerData.subscription_months = planOrMonths.duration_months;
  }

  openRenewModal(owner: any) {
    this.renewOwnerData = owner;
    this.renewMonths = 2;
    this.showRenewModal = true;
  }

  async submitRenewSubscription() {
    if (!this.renewOwnerData) return;
    try {
      await this.apiService.admin.renewOwnerSubscription(this.renewOwnerData.id, {
        duration_months: this.renewMonths,
      });
      this.showRenewModal = false;
      await this.fetchData();
      alert(`Subscription renewed successfully for ${this.renewOwnerData.full_name}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to renew subscription');
    }
  }

  async payWithRazorpayAndCreate() {
    const selectedPlan = this.getSelectedPlan();
    if (!selectedPlan) {
      alert('Please select a subscription plan.');
      return;
    }

    const amount = Number(selectedPlan.price) || 1999;
    const planName = selectedPlan.name || 'Subscription Plan';

    this.isProcessingPayment = true;
    try {
      // 1. Create order on backend using platform keys
      const receiptId = `sub_${Date.now().toString().slice(-8)}`;
      const order = await this.apiService.payments.createRazorpayOrder(amount, receiptId);
      if (!order || !order.id) {
        throw new Error('Could not initialize Razorpay order. Please ensure Razorpay keys are configured in General Settings.');
      }

      // 2. Ensure SDK is loaded
      await this.loadRazorpayScript();
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const razorpayKey = order.key_id || this.generalSettings?.razorpay_key || 'rzp_test_default';

      // 3. Open Razorpay modal
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'StayPulse Platform',
        description: `Subscription: ${planName} (${selectedPlan.duration_months} Months)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Payment success! Record transaction details
            this.ownerData.payment_mode = 'RAZORPAY';
            this.ownerData.payment_status = 'PAID';
            this.ownerData.payment_ref = response.razorpay_payment_id || `pay_${Date.now()}`;
            // 4. Store in database only after payment succeeds
            await this.saveOwnerToDatabase(response);
          } catch (vErr: any) {
            alert(`Payment succeeded, but recording in database failed: ${vErr.message}`);
          }
        },
        prefill: {
          name: this.ownerData.full_name || '',
          email: this.ownerData.email || '',
          contact: this.ownerData.mobile_number || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            this.isProcessingPayment = false;
            console.log('Razorpay modal dismissed by user');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        this.isProcessingPayment = false;
        alert(`Payment failed: ${resp.error?.description || 'Transaction declined'}. Account was not registered.`);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay payment error:', err);
      alert(err.message || 'Payment initiation failed');
      this.isProcessingPayment = false;
    }
  }

  async saveOwnerToDatabase(paymentDetails?: any) {
    try {
      this.isSubmittingOwner = true;
      this.ownerData.contact_number = this.ownerData.mobile_number;
      this.ownerData.property_name = this.ownerData.business_name;

      const formData = new FormData();
      Object.keys(this.ownerData).forEach((key) => {
        const val = (this.ownerData as any)[key];
        if (val !== undefined && val !== null && val !== '') {
          formData.append(key, val);
        }
      });

      if (this.selectedLogoFile) {
        formData.append('logo', this.selectedLogoFile);
      }
      if (this.selectedKycFile) {
        formData.append('kyc_doc', this.selectedKycFile);
      }

      await this.apiService.admin.createOwner(formData);
      alert('Owner & Property account created successfully with active primary branch subscription!');
      this.showCreateOwnerModal = false;
      this.fetchData();
    } catch (err: any) {
      alert(`Error creating owner: ${err.message}`);
    } finally {
      this.isSubmittingOwner = false;
      this.isProcessingPayment = false;
    }
  }

  async createOwner() {
    if (!this.ownerData.plan_id) {
      alert('Please select a subscription plan in Step 5.');
      return;
    }

    if (this.ownerData.payment_mode === 'UPI') {
      if (!this.ownerData.payment_ref || this.ownerData.payment_ref.trim().length < 4) {
        alert('Please enter the 12-digit UPI UTR / Transaction Reference number after completing payment.');
        return;
      }
    }

    if (this.ownerData.payment_mode === 'RAZORPAY') {
      await this.payWithRazorpayAndCreate();
    } else {
      await this.saveOwnerToDatabase();
    }
  }

  // --- VIEW / EDIT / DELETE OWNER ---

  async viewOwnerDetails(owner: any) {
    this.selectedOwner = owner;
    this.showViewModal = true;
    this.selectedOwnerBranches = [];

    const prop = this.properties.find(p => p.owner_id === owner.id);
    if (prop) {
      try {
        const branches = await this.apiService.admin.getBranches();
        this.selectedOwnerBranches = branches.filter((b: any) => b.property_id === prop.id);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async openEditOwnerModal(owner: any) {
    let propName = owner.property_name || '';
    let propType = owner.property_type || 'PG';

    if (!propName) {
      try {
        const properties = await this.apiService.admin.getProperties();
        const prop = properties.find((p: any) => p.owner_id === owner.id);
        if (prop) {
          propName = prop.property_name;
          propType = prop.property_type;
        }
      } catch (err) {
        console.error(err);
      }
    }

    this.editOwnerData = {
      id: owner.id,
      full_name: owner.full_name || '',
      business_name: owner.full_name || '',
      email: owner.email || '',
      contact_number: owner.contact_number || owner.mobile_number || '',
      address: owner.address || '',
      city: owner.city || 'Bengaluru',
      property_name: propName,
      property_type: propType,
    };
    this.showEditOwnerModal = true;
  }

  async updateOwner() {
    try {
      await this.apiService.admin.updateOwner(this.editOwnerData.id, {
        full_name: this.editOwnerData.full_name,
        business_name: this.editOwnerData.business_name,
        email: this.editOwnerData.email,
        contact_number: this.editOwnerData.contact_number,
        address: this.editOwnerData.address,
        city: this.editOwnerData.city,
        property_name: this.editOwnerData.property_name,
        property_type: this.editOwnerData.property_type,
      });
      alert('Owner & Property details updated successfully!');
      this.showEditOwnerModal = false;
      this.fetchData();
    } catch (err: any) {
      alert(`Error updating details: ${err.message}`);
    }
  }

  async deleteOwner(owner: any) {
    if (confirm(`Are you sure you want to delete "${owner.full_name}"?\nThis will remove all associated properties and branches!`)) {
      try {
        await this.apiService.admin.deleteOwner(owner.id);
        alert('Owner deleted successfully!');
        this.fetchData();
      } catch (err: any) {
        alert(`Error deleting owner: ${err.message}`);
      }
    }
  }

  // --- BRANCH ACTIONS ---

  openEditBranchModal(branch: any) {
    this.editBranchData = {
      id: branch.id,
      branch_name: branch.branch_name || '',
      address: branch.address || '',
      city: branch.city || '',
      contact_number: branch.contact_number || '9876543210',
    };
    this.showEditBranchModal = true;
  }

  async updateBranch() {
    try {
      await this.apiService.admin.updateBranch(this.editBranchData.id, {
        branch_name: this.editBranchData.branch_name,
        address: this.editBranchData.address,
        city: this.editBranchData.city,
        contact_number: this.editBranchData.contact_number,
      });
      alert('Branch details updated successfully!');
      this.showEditBranchModal = false;
      await this.fetchData();
    } catch (err: any) {
      alert(`Error updating branch: ${err.message}`);
    }
  }

  async deleteBranch(branch: any) {
    if (confirm(`Are you sure you want to delete branch "${branch.branch_name}"?`)) {
      try {
        await this.apiService.admin.deleteBranch(branch.id);
        alert('Branch deleted successfully!');
        await this.fetchData();
      } catch (err: any) {
        alert(`Error deleting branch: ${err.message}`);
      }
    }
  }

    addBranchForOwner(owner: any) {
    this.loadGeneralSettings();
    const prop = this.properties.find(p => p.owner_id === owner.id);
    if (!prop) {
      alert(`Owner "${owner.full_name}" does not have a property assigned yet.`);
      return;
    }
    this.selectedOwnerForBranch = owner;
    const totalBranches = Number(
      owner.total_branches !== undefined
        ? owner.total_branches
        : this.branches.filter((b: any) => b.property_id === prop.id).length
    );
    const maxBranches = Number(owner.max_branches || 1);

    // Check if covered under active property plan
    this.isBranchCoveredByPlan = (owner.subscription_status === 'ACTIVE') && (totalBranches < maxBranches);

    const defaultPlan = this.plans.length > 0 ? this.plans[0] : null;
    this.branchData = {
      property_id: prop.id,
      branch_name: '',
      address: '',
      city: owner.city || 'Bengaluru',
      state: owner.state || 'Karnataka',
      district: 'Bengaluru Urban',
      contact_number: owner.contact_number || '',
      latitude: 12.9352,
      longitude: 77.6245,
      pg_type: 'UNISEX',
      starting_monthly_rent: 8000,
      plan_id: this.isBranchCoveredByPlan ? '' : (defaultPlan ? defaultPlan.id : ''),
      payment_mode: 'RAZORPAY',
      payment_status: 'PAID',
      payment_ref: '',
    };
    this.renewBranchPaymentMode = 'CASH';
    this.renewBranchPaymentStatus = 'PAID';
    this.renewBranchPaymentRef = '';
    this.createBranchStep = 1;
    this.showAddBranchModal = true;
  }

  getBranchSelectedPlan(): SubscriptionPlan | undefined {
    return this.plans.find(p => p.id === this.branchData.plan_id);
  }

  onBranchPlanSelectChange(planId: string) {
    const plan = this.plans.find(p => p.id === planId);
    if (plan) {
      this.branchData.plan_id = plan.id;
    }
  }

  isProcessingBranchPayment: boolean = false;

  nextBranchStep() {
    if (this.createBranchStep === 1) {
      if (!this.branchData.branch_name || !this.branchData.branch_name.trim()) {
        alert('Please enter the Branch Name.');
        return;
      }
      if (!this.branchData.address || !this.branchData.address.trim()) {
        alert('Please enter the Branch Address.');
        return;
      }
      if (!this.branchData.city || !this.branchData.city.trim()) {
        alert('Please enter the City.');
        return;
      }
      if (!this.branchData.state || !this.branchData.state.trim()) {
        alert('Please enter the State.');
        return;
      }
      this.createBranchStep = 2;
    }
  }

  prevBranchStep() {
    if (this.createBranchStep > 1) {
      this.createBranchStep--;
    }
  }

  goToBranchStep(step: number) {
    if (step < this.createBranchStep) {
      this.createBranchStep = step;
    } else if (step === 2) {
      this.nextBranchStep();
    }
  }

  async payWithRazorpayAndCreateBranch() {
    const selectedPlan = this.getBranchSelectedPlan();
    if (!selectedPlan) {
      alert('Please select a subscription plan for this branch.');
      return;
    }

    const amount = Number(selectedPlan.price) || 1999;
    const planName = selectedPlan.name || 'Branch Subscription Plan';

    this.isProcessingBranchPayment = true;
    try {
      const receiptId = `br_${Date.now().toString().slice(-8)}`;
      const order = await this.apiService.payments.createRazorpayOrder(amount, receiptId);
      if (!order || !order.id) {
        throw new Error('Could not initialize Razorpay order. Please check Razorpay keys in platform settings.');
      }

      await this.loadRazorpayScript();
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const razorpayKey = order.key_id || this.generalSettings?.razorpay_key || 'rzp_test_default';

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'StayPulse Platform',
        description: `Branch Plan: ${planName} (${selectedPlan.duration_months} Months)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            this.branchData.payment_mode = 'RAZORPAY';
            this.branchData.payment_status = 'PAID';
            this.branchData.payment_ref = response.razorpay_payment_id || `pay_${Date.now()}`;
            await this.saveBranchToDatabase();
          } catch (vErr: any) {
            alert(`Payment succeeded, but saving branch failed: ${vErr.message}`);
          }
        },
        prefill: {
          name: this.selectedOwnerForBranch?.full_name || '',
          email: this.selectedOwnerForBranch?.email || '',
          contact: this.branchData.contact_number || this.selectedOwnerForBranch?.contact_number || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            this.isProcessingBranchPayment = false;
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        this.isProcessingBranchPayment = false;
        alert(`Payment failed: ${resp.error?.description || 'Transaction declined'}. Branch was not created.`);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Razorpay branch error:', err);
      alert(err.message || 'Payment initiation failed');
      this.isProcessingBranchPayment = false;
    }
  }

  async saveBranchToDatabase() {
    try {
      await this.apiService.admin.createBranch(this.branchData);
      alert('Branch created successfully with its own active subscription plan!');
      this.showAddBranchModal = false;
      this.createBranchStep = 1;
      await this.fetchData();
    } catch (err: any) {
      alert(`Error creating branch: ${err.message}`);
    } finally {
      this.isProcessingBranchPayment = false;
    }
  }

  async createBranch() {
    try {
      if (!this.branchData.property_id) {
        alert('Please select a Property first.');
        return;
      }
      if (!this.isBranchCoveredByPlan && !this.branchData.plan_id) {
        alert('Please select a subscription plan for this additional branch.');
        return;
      }

      if (!this.isBranchCoveredByPlan && this.branchData.payment_mode === 'UPI') {
        if (!this.branchData.payment_ref || this.branchData.payment_ref.trim().length < 4) {
          alert('Please enter the 12-digit UPI UTR / Transaction Reference number after completing payment.');
          return;
        }
      }

      if (!this.isBranchCoveredByPlan && this.branchData.payment_mode === 'RAZORPAY') {
        await this.payWithRazorpayAndCreateBranch();
        return;
      }

      await this.apiService.admin.createBranch(this.branchData);
      if (this.isBranchCoveredByPlan) {
        alert(`Branch created successfully! It is covered under the active plan "${this.selectedOwnerForBranch?.plan_name}" at no extra charge.`);
      } else {
        alert('Branch created successfully with its own subscription plan!');
      }
      this.showAddBranchModal = false;
      this.createBranchStep = 1;
      await this.fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }

  // --- BRANCH RENEWAL ---
  openRenewBranchModal(branch: any) {
    this.renewBranchData = branch;
    this.renewBranchPlanId = branch.plan_id || (this.plans.length > 0 ? this.plans[0].id : '');
    this.showRenewBranchModal = true;
  }

  async submitRenewBranchSubscription() {
    if (!this.renewBranchData) return;
    try {
      await this.apiService.admin.renewBranchSubscription(this.renewBranchData.id, {
        plan_id: this.renewBranchPlanId,
        payment_mode: this.renewBranchPaymentMode,
        payment_status: this.renewBranchPaymentStatus,
        payment_ref: this.renewBranchPaymentRef,
      });
      alert(`Subscription renewed successfully for branch "${this.renewBranchData.branch_name}"!`);
      this.showRenewBranchModal = false;
      await this.fetchData();
    } catch (err: any) {
      alert(`Error renewing branch: ${err.message}`);
    }
  }

  // --- PLANS CRUD ---
  openCreatePlanModal() {
    this.isEditingPlan = false;
    this.planFormData = {
      id: '',
      name: '',
      duration_months: 2,
      price: 1999,
      max_branches: 1,
      is_active: true,
      featuresText: 'Full PMS Access, Tenant Portal, Auto Invoicing',
    };
    this.showPlanModal = true;
  }

  openEditPlanModal(plan: SubscriptionPlan) {
    this.isEditingPlan = true;
    this.planFormData = {
      id: plan.id,
      name: plan.name,
      duration_months: plan.duration_months,
      price: plan.price,
      max_branches: plan.max_branches,
      is_active: plan.is_active,
      featuresText: Array.isArray(plan.features) ? plan.features.join(', ') : '',
    };
    this.showPlanModal = true;
  }

  async savePlan() {
    try {
      if (!this.planFormData.name) {
        alert('Please enter a Plan Name.');
        return;
      }
      const features = this.planFormData.featuresText
        ? this.planFormData.featuresText.split(',').map(f => f.trim()).filter(Boolean)
        : [];

      const payload = {
        name: this.planFormData.name,
        duration_months: Number(this.planFormData.duration_months),
        price: Number(this.planFormData.price),
        max_branches: Number(this.planFormData.max_branches),
        features,
        is_active: this.planFormData.is_active,
      };

      if (this.isEditingPlan) {
        await this.apiService.admin.updatePlan(this.planFormData.id, payload);
        alert('Subscription Plan updated successfully!');
      } else {
        await this.apiService.admin.createPlan(payload);
        alert('Subscription Plan created successfully!');
      }
      this.showPlanModal = false;
      await this.fetchData();
    } catch (err: any) {
      alert(`Error saving plan: ${err.message}`);
    }
  }

  async deletePlan(plan: SubscriptionPlan) {
    if (confirm(`Are you sure you want to deactivate plan "${plan.name}"?`)) {
      try {
        await this.apiService.admin.deletePlan(plan.id);
        alert(`Plan "${plan.name}" deactivated successfully!`);
        await this.fetchData();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  }
  async loadGeneralSettings() {
    if (this.generalSettingsLoading) return;
    if (this.generalSettings?.upi_id && this.generalSettings.upi_id !== '') return;
    try {
      this.generalSettingsLoading = true;
      this.generalSettingsError = '';
      const res = await this.apiService.admin.getGeneralSettings();
      if (res) {
        const mailVal = res.mail || res.smtp_email || '';
        const userVal = res.user_name || res.smtp_username || '';
        const displayVal = res.display_name || res.smtp_display_name || '';
        const passVal = res.password || res.smtp_password || '';
        const hostVal = res.host || res.smtp_host || '';
        const portVal = res.port || res.smtp_port || '';

        this.generalSettings = {
          ...this.generalSettings,
          ...res,
          razorpay_key: res.razorpay_key || '',
          razorpay_secret: res.razorpay_secret || '',
          upi_id: res.upi_id || '',
          upi_qr_url: res.upi_qr_url || '',
          mail: mailVal,
          smtp_email: mailVal,
          user_name: userVal,
          smtp_username: userVal,
          display_name: displayVal,
          smtp_display_name: displayVal,
          password: passVal,
          smtp_password: passVal,
          host: hostVal,
          smtp_host: hostVal,
          port: portVal,
          smtp_port: portVal,
        };
      }
    } catch (err: any) {
      console.error('Error loading general settings:', err);
      this.generalSettingsError = err.message || 'Failed to load general settings';
    } finally {
      this.generalSettingsLoading = false;
    }
  }

  getQrImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:image/')) return url;
    if (url.length > 100 && !url.startsWith('http') && !url.startsWith('/')) {
      return `data:image/png;base64,${url}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  getUpiQrImage(amount?: number): string {
    const upiId = this.generalSettings?.upi_id || 'platform@staypulse';
    const amt = amount || 1999;
    return getInstantUpiQrUrl({
      upiId,
      payeeName: 'StayPulse Admin',
      amount: amt,
      transactionNote: 'Branch Subscription',
    });
  }

  onQrFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.qrFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.qrPreview = base64;
        this.generalSettings.upi_qr_url = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveGeneralSettings() {
    try {
      this.generalSettingsSaving = true;
      this.generalSettingsSuccess = '';
      this.generalSettingsError = '';

      const formData = new FormData();
      if (this.generalSettings.razorpay_key) formData.append('razorpay_key', this.generalSettings.razorpay_key);
      if (this.generalSettings.razorpay_secret) formData.append('razorpay_secret', this.generalSettings.razorpay_secret);
      if (this.generalSettings.upi_id) formData.append('upi_id', this.generalSettings.upi_id);

      const mail = this.generalSettings.mail || this.generalSettings.smtp_email;
      const user_name = this.generalSettings.user_name || this.generalSettings.smtp_username;
      const display_name = this.generalSettings.display_name || this.generalSettings.smtp_display_name;
      const password = this.generalSettings.password || this.generalSettings.smtp_password;
      const host = this.generalSettings.host || this.generalSettings.smtp_host;
      const port = this.generalSettings.port || this.generalSettings.smtp_port;

      if (mail) {
        formData.append('mail', mail);
        formData.append('smtp_email', mail);
      }
      if (user_name) {
        formData.append('user_name', user_name);
        formData.append('smtp_username', user_name);
      }
      if (display_name) {
        formData.append('display_name', display_name);
        formData.append('smtp_display_name', display_name);
      }
      if (password) {
        formData.append('password', password);
        formData.append('smtp_password', password);
      }
      if (host) {
        formData.append('host', host);
        formData.append('smtp_host', host);
      }
      if (port) {
        formData.append('port', port);
        formData.append('smtp_port', port);
      }

      if (this.generalSettings.upi_qr_url && this.generalSettings.upi_qr_url.startsWith('data:image/')) {
        formData.append('upi_qr_base64', this.generalSettings.upi_qr_url);
      }
      if (this.qrFile) {
        formData.append('upi_qr', this.qrFile);
      }

      const res = await this.apiService.admin.updateGeneralSettings(formData);
      if (res) {
        const mailVal = res.mail || res.smtp_email || '';
        const userVal = res.user_name || res.smtp_username || '';
        const displayVal = res.display_name || res.smtp_display_name || '';
        const passVal = res.password || res.smtp_password || '';
        const hostVal = res.host || res.smtp_host || '';
        const portVal = res.port || res.smtp_port || '';

        this.generalSettings = {
          ...this.generalSettings,
          ...res,
          razorpay_key: res.razorpay_key || '',
          razorpay_secret: res.razorpay_secret || '',
          upi_id: res.upi_id || '',
          upi_qr_url: res.upi_qr_url || '',
          mail: mailVal,
          smtp_email: mailVal,
          user_name: userVal,
          smtp_username: userVal,
          display_name: displayVal,
          smtp_display_name: displayVal,
          password: passVal,
          smtp_password: passVal,
          host: hostVal,
          smtp_host: hostVal,
          port: portVal,
          smtp_port: portVal,
        };
      }
      this.generalSettingsSuccess = 'Platform General Settings saved successfully!';
      this.qrFile = null;
      setTimeout(() => {
        this.generalSettingsSuccess = '';
      }, 4000);
    } catch (err: any) {
      console.error('Error saving general settings:', err);
      this.generalSettingsError = err.message || 'Failed to save general settings';
    } finally {
      this.generalSettingsSaving = false;
    }
  }
}
