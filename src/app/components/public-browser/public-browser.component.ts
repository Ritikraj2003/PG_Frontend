import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';
import { Property, Room, User } from '../../models/types';
import * as L from 'leaflet';

export interface NearbyPG {
  id: string;
  property_id: string;
  name: string;
  pg_name?: string;
  branch_name?: string;
  property_name: string;
  address: string;
  city: string;
  state: string;
  district?: string;
  contact_number?: string;
  latitude: number;
  longitude: number;
  pg_type: string;
  rating: number;
  total_reviews: number;
  food_available: boolean;
  ac_available: boolean;
  description?: string;
  cover_image: string;
  images: string[];
  amenities: string[];
  distance_km: number | null;
  min_rent: number;
  max_rent: number;
  total_rooms: number;
  total_beds: number;
  available_beds: number;
  rooms?: any[];
}

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
export class PublicBrowserComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() user: User | null = null;
  @Output() openAuth = new EventEmitter<void>();

  private apiService = inject(ApiService);
  Number = Number;

  // View Mode: 'list' or 'map'
  viewMode: 'list' | 'map' = 'list';

  // Geolocation & 40 KM Radius States
  userLat: number = 12.9716; // Default: Bengaluru
  userLng: number = 77.5946;
  userLocationName: string = 'Bengaluru, Karnataka';
  searchRadius: number = 40; // Default: 40 KM
  locationState: 'detecting' | 'granted' | 'denied' | 'custom' = 'custom';
  locationErrorMsg: string | null = null;

  // Nearby PGs Collection
  nearbyPGs: NearbyPG[] = [];
  selectedPGForDetail: NearbyPG | null = null;
  showPGDetailModal: boolean = false;
  loading: boolean = true;
  bookingMessage: string | null = null;

  // Search & Filter Controls
  searchKeyword: string = '';
  genderFilter: string = 'ALL'; // ALL, MALE, FEMALE, UNISEX
  minRent: number | null = null;
  maxRent: number | null = null;
  roomTypeFilter: string = 'ALL'; // ALL, Single, Double, Triple
  foodFilter: boolean | null = null;
  acFilter: boolean | null = null;
  sortBy: string = 'distance'; // distance, price_asc, price_desc, rating

  // Quick preset cities for easy fallback testing
  presetCities = [
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
    { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
    { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  ];

  // Leaflet Map Handles
  private leafletMap: L.Map | null = null;
  private userMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;
  private pgMarkerLayer: L.LayerGroup | null = null;

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

    // Attempt browser geolocation or use default
    this.detectUserLocation(false);
  }

  ngAfterViewInit() {
    if (this.viewMode === 'map') {
      setTimeout(() => this.initOrUpdateMap(), 200);
    }
  }

  ngOnDestroy() {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  getUserName(): string {
    if (!this.user) return '';
    return this.user.full_name || (this.user as any).name || 'User';
  }

  getUserRole(): string {
    if (!this.user) return '';
    return (this.user as any).role || this.user.roles?.[0] || '';
  }

  // --- LOCATION DETECTION & MANAGEMENT ---
  detectUserLocation(forcePrompt = true) {
    if (!navigator.geolocation) {
      this.locationState = 'denied';
      this.locationErrorMsg = 'Geolocation is not supported by your browser.';
      this.fetchNearbyPGs();
      return;
    }

    this.locationState = 'detecting';
    this.locationErrorMsg = null;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLat = Number(position.coords.latitude.toFixed(6));
        this.userLng = Number(position.coords.longitude.toFixed(6));
        this.userLocationName = 'Current GPS Location';
        this.locationState = 'granted';
        this.fetchNearbyPGs();
        if (this.viewMode === 'map') {
          this.initOrUpdateMap();
        }
      },
      (error) => {
        console.warn('Geolocation access issue:', error.message);
        this.locationState = 'denied';
        if (forcePrompt) {
          this.locationErrorMsg = 'Location permission was denied or unavailable. Showing PGs near Bengaluru.';
        }
        // Fallback to Bengaluru default coordinates
        this.userLat = 12.9716;
        this.userLng = 77.5946;
        this.userLocationName = 'Bengaluru, Karnataka';
        this.fetchNearbyPGs();
        if (this.viewMode === 'map') {
          this.initOrUpdateMap();
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  selectPresetCity(city: { name: string; lat: number; lng: number; state: string }) {
    this.userLat = city.lat;
    this.userLng = city.lng;
    this.userLocationName = `${city.name}, ${city.state}`;
    this.locationState = 'custom';
    this.locationErrorMsg = null;
    this.fetchNearbyPGs();
    if (this.viewMode === 'map') {
      this.initOrUpdateMap();
    }
  }

  get selectedCityDropdown(): string {
    if (this.locationState === 'granted' || this.userLocationName.toLowerCase().includes('gps')) {
      return 'GPS';
    }
    const found = this.presetCities.find(c => this.userLocationName.toLowerCase().includes(c.name.toLowerCase()));
    return found ? found.name : 'GPS';
  }

  onCityDropdownSelect(cityName: string) {
    if (cityName === 'GPS') {
      this.detectUserLocation(true);
    } else {
      const city = this.presetCities.find(c => c.name === cityName);
      if (city) {
        this.selectPresetCity(city);
      }
    }
  }

  onCityDropdownChange(event: any) {
    this.onCityDropdownSelect(event.target.value);
  }

  // --- FETCH NEARBY PGS ---
  async fetchNearbyPGs() {
    this.loading = true;
    try {
      const filters: any = {
        lat: this.userLat,
        lng: this.userLng,
        radius: this.searchRadius,
        search: this.searchKeyword.trim() || undefined,
        gender: this.genderFilter !== 'ALL' ? this.genderFilter : undefined,
        min_rent: this.minRent || undefined,
        max_rent: this.maxRent || undefined,
        room_type: this.roomTypeFilter !== 'ALL' ? this.roomTypeFilter : undefined,
        sort_by: this.sortBy,
      };

      if (this.foodFilter !== null) filters.food = this.foodFilter;
      if (this.acFilter !== null) filters.ac = this.acFilter;

      const results = await this.apiService.public.getNearbyPGs(filters);
      this.nearbyPGs = Array.isArray(results) ? results : [];

      if (this.viewMode === 'map') {
        setTimeout(() => this.initOrUpdateMap(), 100);
      }
    } catch (err: any) {
      console.error('Failed to fetch nearby PGs:', err);
      this.nearbyPGs = [];
    } finally {
      this.loading = false;
    }
  }

  onRadiusChange() {
    this.fetchNearbyPGs();
  }

  setViewMode(mode: 'list' | 'map') {
    this.viewMode = mode;
    if (mode === 'map') {
      setTimeout(() => {
        this.initOrUpdateMap();
        if (this.leafletMap) {
          this.leafletMap.invalidateSize();
        }
      }, 250);
    }
  }

  // --- LEAFLET OPENSTREETMAP LOGIC ---
  private initOrUpdateMap() {
    const mapContainer = document.getElementById('pg-leaflet-map');
    if (!mapContainer) return;

    // Initialize Map if not already created
    if (!this.leafletMap) {
      this.leafletMap = L.map('pg-leaflet-map', {
        center: [this.userLat, this.userLng],
        zoom: 11,
        zoomControl: true,
      });

      // OpenStreetMap Tile Layer (100% Free, Zero Google Maps Cost)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(this.leafletMap);

      this.pgMarkerLayer = L.layerGroup().addTo(this.leafletMap);
    } else {
      this.leafletMap.setView([this.userLat, this.userLng], 11);
    }

    // 1. Draw/Update User Location Marker (Pulse Pin)
    if (this.userMarker) {
      this.userMarker.remove();
    }
    const userPinIcon = L.divIcon({
      className: 'custom-user-map-pin',
      html: `
        <div class="user-pulse-outer">
          <div class="user-pulse-ring"></div>
          <div class="user-pulse-core"><i class="fa-solid fa-user"></i></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    this.userMarker = L.marker([this.userLat, this.userLng], { icon: userPinIcon })
      .addTo(this.leafletMap)
      .bindPopup(`<strong>👤 You are here</strong><br><small>${this.userLocationName}</small>`);

    // 2. Draw/Update 40 KM Radius Circle
    if (this.radiusCircle) {
      this.radiusCircle.remove();
    }
    this.radiusCircle = L.circle([this.userLat, this.userLng], {
      radius: this.searchRadius * 1000, // Convert km to meters
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(this.leafletMap);

    // 3. Clear and Render PG Markers
    if (this.pgMarkerLayer) {
      this.pgMarkerLayer.clearLayers();
    }

    this.nearbyPGs.forEach((pg) => {
      if (!pg.latitude || !pg.longitude) return;

      const rentDisplay = pg.min_rent > 0 ? `₹${Math.round(pg.min_rent / 1000)}k` : 'PG';
      const pgIcon = L.divIcon({
        className: 'custom-pg-map-pin',
        html: `
          <div class="pg-pin-card">
            <span class="pg-pin-price">${rentDisplay}</span>
            <div class="pg-pin-pointer"></div>
          </div>
        `,
        iconSize: [52, 34],
        iconAnchor: [26, 34],
      });

      const marker = L.marker([pg.latitude, pg.longitude], { icon: pgIcon });

      // Interactive Popup on Marker Click
      const popupHtml = `
        <div class="map-popup-card">
          <div class="map-popup-header">
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${pg.name}</h4>
            <span style="font-size: 11px; color: #2563eb; font-weight: 600;">📍 ${pg.distance_km ?? 0} km away</span>
          </div>
          <p style="margin: 4px 0 8px; font-size: 11px; color: #64748b;">${pg.address}, ${pg.city}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #059669; font-size: 13px;">₹${Number(pg.min_rent).toLocaleString()}/mo</strong>
            <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
              ${pg.available_beds} beds free
            </span>
          </div>
          <button 
            id="popup-btn-${pg.id}"
            style="width: 100%; background: #2563eb; color: #fff; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;"
          >
            View PG Details & Book
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${pg.id}`);
        if (btn) {
          btn.onclick = () => this.openPGDetail(pg);
        }
      });

      if (this.pgMarkerLayer) {
        this.pgMarkerLayer.addLayer(marker);
      }
    });

    // Fit map bounds to show both user and nearby PGs comfortably
    if (this.nearbyPGs.length > 0) {
      const bounds = L.latLngBounds([[this.userLat, this.userLng]]);
      this.nearbyPGs.forEach((pg) => {
        if (pg.latitude && pg.longitude) {
          bounds.extend([pg.latitude, pg.longitude]);
        }
      });
      this.leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }

  // --- PG DETAIL & ROOM SELECTION MODAL ---
  async openPGDetail(pg: NearbyPG) {
    try {
      this.selectedPGForDetail = await this.apiService.public.getPGById(pg.id, this.userLat, this.userLng);
    } catch {
      this.selectedPGForDetail = pg;
    }
    this.showPGDetailModal = true;
  }

  closePGDetail() {
    this.showPGDetailModal = false;
    this.selectedPGForDetail = null;
  }

  getImageUrl(url: string): string {
    if (!url) return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${cleanPath}`;
  }

  // --- BOOKING MODAL ACTIONS ---
  openBookingModalFromPG(pg: NearbyPG, room?: any) {
    if (!this.user) {
      alert('Registration or Login is required before reserving a room/bed.');
      this.openAuth.emit();
      return;
    }

    const targetRoom = room || pg.rooms?.[0];
    if (!targetRoom) {
      alert('No specific room is currently available for direct online booking.');
      return;
    }

    const availableBed = targetRoom.beds?.find((b: any) => b.status === 'AVAILABLE');

    this.selectedRoomForBooking = {
      ...targetRoom,
      branch_id: pg.id,
      branch_name: pg.name,
    };

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
    this.showPGDetailModal = false;
    this.showBookingModal = true;
  }

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

      // Refresh PG List
      await this.fetchNearbyPGs();
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
