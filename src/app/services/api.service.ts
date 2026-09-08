import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { loader } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiBase = environment.apiUrl;

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    loader('start');
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers: Record<string, string> = {};

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      if (options.headers) {
        Object.assign(headers, options.headers as Record<string, string>);
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiBase}${endpoint}`, {
        ...options,
        headers,
      });

      let json: any = {};
      const text = await response.text();
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server connection issue (${response.status}: ${response.statusText || 'Error'})`);
      }

      if (!response.ok || json.success === false) {
        throw new Error(json.message || `API Request failed (${response.status})`);
      }

      return json.data;
    } finally {
      loader('stop');
    }
  }

  async uploadFile(file: File): Promise<string> {
    loader('start');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiBase}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || json.success === false) {
        throw new Error(json.message || 'File upload failed');
      }
      return json.data.url;
    } finally {
      loader('stop');
    }
  }

  // Auth
  auth = {
    login: (credentials: { emailOrMobile: string; password: string }) =>
      this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

    register: (userData: any) =>
      this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  };

  // Public
  public = {
    getProperties: (city?: string, type?: string) => {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (type) params.append('type', type);
      const query = params.toString() ? `?${params.toString()}` : '';
      return this.request(`/public/properties${query}`);
    },

    getNearbyPGs: (filters: {
      lat?: number;
      lng?: number;
      radius?: number;
      search?: string;
      gender?: string;
      min_rent?: number;
      max_rent?: number;
      room_type?: string;
      food?: boolean;
      ac?: boolean;
      sort_by?: string;
    } = {}) => {
      const params = new URLSearchParams();
      if (filters.lat !== undefined) params.append('lat', filters.lat.toString());
      if (filters.lng !== undefined) params.append('lng', filters.lng.toString());
      if (filters.radius !== undefined) params.append('radius', filters.radius.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.min_rent !== undefined) params.append('min_rent', filters.min_rent.toString());
      if (filters.max_rent !== undefined) params.append('max_rent', filters.max_rent.toString());
      if (filters.room_type) params.append('room_type', filters.room_type);
      if (filters.food !== undefined) params.append('food', filters.food.toString());
      if (filters.ac !== undefined) params.append('ac', filters.ac.toString());
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      const query = params.toString() ? `?${params.toString()}` : '';
      return this.request(`/public/pgs/nearby${query}`);
    },

    getPGById: (id: string, lat?: number, lng?: number) => {
      const params = new URLSearchParams();
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lng !== undefined) params.append('lng', lng.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return this.request(`/public/pgs/${id}${query}`);
    },

    getRooms: (branchId?: string) =>
      this.request(`/public/rooms${branchId ? `?branch_id=${branchId}` : ''}`),
    getPlans: () => this.request('/public/plans'),
    
    getPlatformPaymentInfo: () => this.request('/public/platform-payment-info'),
  };

  // Admin
  admin = {
    getReports: () => this.request('/admin/reports'),
    getOwners: () => this.request('/admin/owners'),
    getProperties: () => this.request('/admin/properties'),
    getBranches: () => this.request('/admin/branches'),
    createOwner: (data: any) =>
      this.request('/admin/owners', {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    updateOwner: (id: string, data: any) => this.request(`/admin/owners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteOwner: (id: string) => this.request(`/admin/owners/${id}`, { method: 'DELETE' }),
    createProperty: (data: any) => this.request('/admin/properties', { method: 'POST', body: JSON.stringify(data) }),
    createBranch: (data: any) => this.request('/admin/branches', { method: 'POST', body: JSON.stringify(data) }),
    updateBranch: (id: string, data: any) => this.request(`/admin/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBranch: (id: string) => this.request(`/admin/branches/${id}`, { method: 'DELETE' }),
    renewOwnerSubscription: (ownerId: string, data: any) =>
      this.request(`/admin/owners/${ownerId}/renew-subscription`, { method: 'POST', body: JSON.stringify(data) }),
    getPlans: (activeOnly: boolean = false) => this.request(`/admin/plans${activeOnly ? '?active_only=true' : ''}`),
    createPlan: (data: any) => this.request('/admin/plans', { method: 'POST', body: JSON.stringify(data) }),
    updatePlan: (id: string, data: any) => this.request(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePlan: (id: string) => this.request(`/admin/plans/${id}`, { method: 'DELETE' }),
    renewBranchSubscription: (branchId: string, data: any) =>
      this.request(`/admin/branches/${branchId}/renew-subscription`, { method: 'POST', body: JSON.stringify(data) }),
    getGeneralSettings: () => this.request('/admin/general-settings'),
    updateGeneralSettings: (data: any) =>
      this.request('/admin/general-settings', {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
  };

  // Owner
  owner = {
    // Roles & Permissions (RBAC)
    getPermissions: () => this.request('/owner/permissions'),
    getRoles: () => this.request('/owner/roles'),
    createRole: (data: any) => this.request('/owner/roles', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id: number | string, data: any) => this.request(`/owner/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRole: (id: number | string) => this.request(`/owner/roles/${id}`, { method: 'DELETE' }),

    // Staff / Team Members
    getTeam: () => this.request('/owner/team'),
    createStaff: (data: any) => this.request('/owner/team', { method: 'POST', body: JSON.stringify(data) }),
    updateStaff: (id: string, data: any) => this.request(`/owner/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteStaff: (id: string) => this.request(`/owner/team/${id}`, { method: 'DELETE' }),
    getBranches: () => this.request('/owner/branches'),

    getDashboard: (branchId?: string) => this.request(`/owner/dashboard${branchId ? `?branch_id=${branchId}` : ''}`),
    getBranchSettings: (branchId: string) => this.request(`/owner/branch-settings?branch_id=${branchId}`),
    updateBranchSettings: (branchId: string, data: any) => this.request(`/owner/branch-settings?branch_id=${branchId}`, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),
    getFloors: (branchId: string) => this.request(`/owner/floors?branch_id=${branchId}`),
    createFloor: (data: any) => this.request('/owner/floors', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
    updateFloor: (id: string, data: any) => this.request(`/owner/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteFloor: (id: string) => this.request(`/owner/floors/${id}`, { method: 'DELETE' }),
    getRoomTypes: () => this.request('/owner/room-types'),
    getRooms: (branchId: string) => this.request(`/owner/rooms?branch_id=${branchId}`),
    createRoom: (data: any) => this.request('/owner/rooms', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
    getBeds: (roomId: string) => this.request(`/owner/beds?room_id=${roomId}`),
    createBed: (data: any) => this.request('/owner/beds', { method: 'POST', body: JSON.stringify(data) }),
    updateBed: (id: string, data: any) => this.request(`/owner/beds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBed: (id: string) => this.request(`/owner/beds/${id}`, { method: 'DELETE' }),
    getBookings: (branchId: string) => this.request(`/owner/bookings?branch_id=${branchId}`),
    updateBookingStatus: (id: string, status: string, remarks?: string) =>
      this.request(`/owner/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, remarks }) }),
    getRentInvoices: (branchId: string) => this.request(`/owner/rent/invoices?branch_id=${branchId}`),
    createRentInvoice: (data: any) => this.request('/owner/rent/invoices', { method: 'POST', body: JSON.stringify(data) }),
    getComplaints: (branchId: string) => this.request(`/owner/complaints?branch_id=${branchId}`),
    updateComplaintStatus: (id: string, status: string, note?: string) =>
      this.request(`/owner/complaints/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, resolution_note: note }) }),
    getExpenses: (branchId: string) => this.request(`/owner/expenses?branch_id=${branchId}`),
    createExpense: (data: any) => this.request('/owner/expenses', { method: 'POST', body: JSON.stringify(data) }),
    getTenants: (branchId: string) => this.request(`/owner/tenants?branch_id=${branchId}`),
    getPayments: (branchId: string) => this.request(`/owner/payments?branch_id=${branchId}`),
    verifyManualPayment: (id: string, status: string, remarks?: string) =>
      this.request(`/owner/payments/${id}/verify`, { method: 'POST', body: JSON.stringify({ status, remarks }) }),
    renewSubscription: (data: any) =>
      this.request('/owner/subscription/renew', { method: 'POST', body: JSON.stringify(data) }),
    renewBranch: (branchId: string, data: any) =>
      this.request(`/owner/branches/${branchId}/renew-subscription`, { method: 'POST', body: JSON.stringify(data) }),
    getPlatformPaymentInfo: () => this.request('/owner/platform-payment-info'),
    createSubscriptionOrder: (data: any) =>
      this.request('/owner/subscription/create-order', { method: 'POST', body: JSON.stringify(data) }),
    verifySubscriptionPayment: (data: any) =>
      this.request('/owner/subscription/verify-and-renew', { method: 'POST', body: JSON.stringify(data) }),
  };

  // Tenant
  tenant = {
    getDashboard: () => this.request('/tenant/dashboard'),
    createBooking: (data: any) => this.request('/tenant/booking', { method: 'POST', body: JSON.stringify(data) }),
    getBookings: () => this.request('/tenant/booking'),
    getInvoices: () => this.request('/tenant/rent'),
    getComplaints: () => this.request('/tenant/complaints'),
    createComplaint: (data: any) => this.request('/tenant/complaints', { method: 'POST', body: JSON.stringify(data) }),
    getBranchSettings: (branchId: string) => this.request(`/tenant/branch-settings?branch_id=${branchId}`),
    submitManualPayment: (data: any) => this.request('/tenant/payments/manual', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  };

  // Payments
  payments = {
    createRazorpayOrder: (amount: number, receipt?: string, branchId?: string) =>
      this.request('/payments/razorpay/order', { method: 'POST', body: JSON.stringify({ amount, receipt, branch_id: branchId }) }),
    verifyPayment: (data: any) =>
      this.request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),
  };
}
