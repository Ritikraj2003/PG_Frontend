import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { Property, Room, User } from '../../models/types';

export interface BranchGroup {
  branch_id: string;
  branch_name: string;
  property_name: string;
  city?: string;
  address?: string;
  rooms: any[];
}

export interface PropertyGroup {
  property_id: string;
  property_name: string;
  branches: BranchGroup[];
}

@Component({
  selector: 'app-public-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-browser.component.html',
  styleUrl: './public-browser.component.css',
})
export class PublicBrowserComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() openAuth = new EventEmitter<void>();

  private apiService = inject(ApiService);

  Number = Number;

  properties: Property[] = [];
  rooms: Room[] = [];
  branchGroups: BranchGroup[] = [];
  propertyGroups: PropertyGroup[] = [];

  searchCity = '';
  filterType = '';
  loading = true;
  bookingMessage: string | null = null;

  // Default design data matching the exact requested StayPulse screenshot
  defaultPropertyGroups: PropertyGroup[] = [
    {
      property_id: 'stay-raj',
      property_name: 'Stay Raj',
      branches: [
        {
          branch_id: 'b-main',
          branch_name: 'Main Branch',
          property_name: 'Stay Raj',
          city: 'Bangalore, KA',
          rooms: [
            {
              id: 'r1',
              room_number: '101',
              room_name: 'Premium Studio',
              monthly_rent: 12000,
              security_deposit: 12000,
              status: 'AVAILABLE',
              available_beds: 1,
              total_beds: 1,
              images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi', 'ac'],
            },
            {
              id: 'r2',
              room_number: '102',
              room_name: 'Economy Single',
              monthly_rent: 7500,
              security_deposit: 7500,
              status: 'AVAILABLE',
              available_beds: 1,
              total_beds: 1,
              images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi'],
            },
            {
              id: 'r3',
              room_number: '103',
              room_name: 'Standard Twin',
              monthly_rent: 10500,
              security_deposit: 10500,
              status: 'OCCUPIED',
              available_beds: 0,
              total_beds: 2,
              images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi', 'tv'],
            },
            {
              id: 'r4',
              room_number: '104',
              room_name: 'Luxury Suite',
              monthly_rent: 22000,
              security_deposit: 22000,
              status: 'AVAILABLE',
              available_beds: 1,
              total_beds: 1,
              images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi', 'ac', 'tv'],
            },
            {
              id: 'r5',
              room_number: '105',
              room_name: 'Compact Studio',
              monthly_rent: 9000,
              security_deposit: 9000,
              status: 'AVAILABLE',
              available_beds: 1,
              total_beds: 1,
              images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi'],
            },
          ],
        },
        {
          branch_id: 'b-north',
          branch_name: 'North Branch',
          property_name: 'Stay Raj',
          city: 'Mumbai, MH',
          rooms: [
            {
              id: 'r6',
              room_number: '201',
              room_name: 'Deluxe Suite',
              monthly_rent: 18000,
              security_deposit: 18000,
              status: 'OCCUPIED',
              available_beds: 0,
              total_beds: 1,
              images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi', 'ac', 'tv'],
            },
          ],
        },
      ],
    },
    {
      property_id: 'heritage-residency',
      property_name: 'Heritage Residency',
      branches: [
        {
          branch_id: 'b-central',
          branch_name: 'Central Residency',
          property_name: 'Heritage Residency',
          city: 'Hyderabad, TS',
          rooms: [
            {
              id: 'r7',
              room_number: '301',
              room_name: 'Twin Share',
              monthly_rent: 8500,
              security_deposit: 8500,
              status: 'AVAILABLE',
              available_beds: 1,
              total_beds: 2,
              images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80'],
              amenities: ['wifi'],
            },
          ],
        },
      ],
    },
  ];

  // Booking Modal & Multi-step Onboarding Form
  showBookingModal = false;
  selectedRoomForBooking: any = null;
  activeBookingStep = 1; // 1: Financials, 2: Profile, 3: KYC, 4: Payment
  isSubmittingBooking = false;
  bookingReceipt: any = null;

  bookingForm = {
    selectedBedId: '',
    expected_check_in_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    occupation: '',
    company_name: '',
    permanent_address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_name: '',
    emergency_phone: '',
    emergency_relation: 'Parent',
    document_type: 'AADHAAR',
    document_number: '',
    payment_method: 'UPI',
    remarks: '',
  };

  selectedDocFile: File | null = null;
  docFilePreview: string | null = null;

  selectedPhotoFile: File | null = null;
  photoFilePreview: string | null = null;

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

  getUserName(): string {
    if (!this.user) return '';
    return this.user.full_name || (this.user as any).name || 'User';
  }

  getUserRole(): string {
    if (!this.user) return '';
    return (this.user as any).role || this.user.roles?.[0] || '';
  }

  async fetchData() {
    this.loading = true;
    this.branchGroups = [];
    this.propertyGroups = [];
    try {
      const role = (this.user as any)?.role || this.user?.roles?.[0];

      if (this.user && (role === 'OWNER' || role === 'PROPERTY_OWNER')) {
        // --- LOGGED-IN OWNER: Fetch ONLY their Property & Branches ---
        const dashboard = await this.apiService.owner.getDashboard().catch(() => null);
        if (dashboard && dashboard.branches) {
          const ownerBranches = dashboard.branches;
          const ownerPropName = dashboard.property?.property_name || 'My PG Property';

          for (const b of ownerBranches) {
            const bRooms = await this.apiService.owner.getRooms(b.id).catch(() => []);
            this.branchGroups.push({
              branch_id: b.id,
              branch_name: b.branch_name,
              property_name: ownerPropName,
              city: b.city,
              address: b.address,
              rooms: bRooms || [],
            });
          }
        }
      } else {
        // --- PUBLIC GUEST or TENANT ---
        this.properties = await this.apiService.public.getProperties(this.searchCity, this.filterType).catch(() => []);
        this.rooms = await this.apiService.public.getRooms().catch(() => []);

        // Group rooms by Branch
        const groupsMap = new Map<string, BranchGroup>();
        for (const room of this.rooms) {
          const bId = room.branch_id || 'default';
          if (!groupsMap.has(bId)) {
            groupsMap.set(bId, {
              branch_id: bId,
              branch_name: room.branch_name || 'Main Branch',
              property_name: room.property_name || 'Stay Raj',
              city: (room as any).city,
              rooms: [],
            });
          }
          groupsMap.get(bId)!.rooms.push(room);
        }

        this.branchGroups = Array.from(groupsMap.values());
      }

      // Populate propertyGroups from branchGroups
      if (this.branchGroups.length > 0) {
        const propMap = new Map<string, PropertyGroup>();
        for (const bg of this.branchGroups) {
          const pName = bg.property_name || 'Stay Raj';
          if (!propMap.has(pName)) {
            propMap.set(pName, {
              property_id: pName.toLowerCase().replace(/\s+/g, '-'),
              property_name: pName,
              branches: [],
            });
          }
          propMap.get(pName)!.branches.push(bg);
        }
        this.propertyGroups = Array.from(propMap.values());
      } else {
        // Use default StayPulse properties if database is empty/fresh
        this.propertyGroups = this.defaultPropertyGroups;
      }

      // Filter by city search if provided
      if (this.searchCity.trim()) {
        const term = this.searchCity.trim().toLowerCase();
        this.propertyGroups = this.propertyGroups.map(pg => ({
          ...pg,
          branches: pg.branches.filter(b => 
            (b.city && b.city.toLowerCase().includes(term)) ||
            (b.branch_name && b.branch_name.toLowerCase().includes(term)) ||
            (pg.property_name && pg.property_name.toLowerCase().includes(term))
          )
        })).filter(pg => pg.branches.length > 0);
      }

    } catch (err) {
      console.error('Failed to fetch browser data:', err);
      this.propertyGroups = this.defaultPropertyGroups;
    } finally {
      this.loading = false;
    }
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${cleanPath}`;
  }

  // --- BOOKING MODAL ACTIONS ---
  openBookingModal(room: any) {
    const isAvailable = room.status === 'AVAILABLE' || (room.available_beds && Number(room.available_beds) > 0);
    if (!isAvailable) {
      alert('This room or bed is currently fully occupied or reserved.');
      return;
    }
    if (!this.user) {
      alert('Registration or Login is required before reserving a room/bed.');
      this.openAuth.emit();
      return;
    }

    const availableBed = room.beds?.find((b: any) => b.status === 'AVAILABLE');

    this.selectedRoomForBooking = room;
    this.activeBookingStep = 1;
    this.bookingForm = {
      selectedBedId: availableBed?.id || '',
      expected_check_in_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      occupation: '',
      company_name: '',
      permanent_address: '',
      city: '',
      state: '',
      pincode: '',
      emergency_name: '',
      emergency_phone: '',
      emergency_relation: 'Parent',
      document_type: 'AADHAAR',
      document_number: '',
      payment_method: 'UPI',
      remarks: '',
    };
    this.selectedDocFile = null;
    this.docFilePreview = null;
    this.selectedPhotoFile = null;
    this.photoFilePreview = null;
    this.showBookingModal = true;
  }

  closeBookingModal() {
    this.showBookingModal = false;
    this.selectedRoomForBooking = null;
  }

  // Financial Calculations
  getMonthlyRent(): number {
    return parseFloat(this.selectedRoomForBooking?.monthly_rent || 0);
  }

  getSecurityDeposit(): number {
    return parseFloat(this.selectedRoomForBooking?.security_deposit || 0);
  }

  getElectricityCharge(): number {
    return parseFloat(this.selectedRoomForBooking?.electricity_charge || 500);
  }

  getMaintenanceCharge(): number {
    return parseFloat(this.selectedRoomForBooking?.maintenance_charge || 300);
  }

  getTotalAdvancePayable(): number {
    return this.getMonthlyRent() + this.getSecurityDeposit() + this.getElectricityCharge() + this.getMaintenanceCharge();
  }

  // File Handlers
  onDocFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedDocFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => (this.docFilePreview = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  onPhotoFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => (this.photoFilePreview = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  async submitCompleteBooking() {
    if (!this.selectedRoomForBooking) return;
    if (!this.bookingForm.expected_check_in_date) {
      alert('Please select an expected Check-In Date.');
      return;
    }

    try {
      this.isSubmittingBooking = true;

      // 1. Upload KYC Document if selected
      let documentUrl: string | undefined = undefined;
      if (this.selectedDocFile) {
        documentUrl = await this.apiService.uploadFile(this.selectedDocFile).catch(() => undefined);
      }

      // 2. Upload Photo if selected
      let photoUrl: string | undefined = undefined;
      if (this.selectedPhotoFile) {
        photoUrl = await this.apiService.uploadFile(this.selectedPhotoFile).catch(() => undefined);
      }

      // 3. Complete Booking Payload
      const totalAdvance = this.getTotalAdvancePayable();
      const payload = {
        branch_id: this.selectedRoomForBooking.branch_id,
        room_id: this.selectedRoomForBooking.id,
        bed_id: this.bookingForm.selectedBedId || undefined,
        expected_check_in_date: this.bookingForm.expected_check_in_date,
        advance_payment_amount: totalAdvance,
        payment_method: this.bookingForm.payment_method,
        occupation: this.bookingForm.occupation,
        company_name: this.bookingForm.company_name,
        permanent_address: this.bookingForm.permanent_address,
        city: this.bookingForm.city,
        state: this.bookingForm.state,
        pincode: this.bookingForm.pincode,
        photo: photoUrl,
        emergency_name: this.bookingForm.emergency_name,
        emergency_phone: this.bookingForm.emergency_phone,
        emergency_relation: this.bookingForm.emergency_relation,
        document_type: this.bookingForm.document_type,
        document_number: this.bookingForm.document_number,
        document_url: documentUrl,
        remarks: `Booked online. Advance Paid: ₹${totalAdvance} via ${this.bookingForm.payment_method}`,
      };

      const bookingRes = await this.apiService.tenant.createBooking(payload);

      // Close Form Modal & Open Receipt Modal
      this.showBookingModal = false;
      this.bookingReceipt = {
        ...bookingRes,
        room_number: this.selectedRoomForBooking.room_number,
        branch_name: this.selectedRoomForBooking.branch_name || 'PG Branch',
        breakdown: {
          monthly_rent: this.getMonthlyRent(),
          security_deposit: this.getSecurityDeposit(),
          electricity_charge: this.getElectricityCharge(),
          maintenance_charge: this.getMaintenanceCharge(),
          total_paid: totalAdvance,
        },
      };

      // Refresh Room List
      await this.fetchData();
    } catch (err: any) {
      alert(`Booking submission error: ${err.message || 'Failed to process booking'}`);
    } finally {
      this.isSubmittingBooking = false;
    }
  }

  closeReceiptModal() {
    this.bookingReceipt = null;
  }
}
