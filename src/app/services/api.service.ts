import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiBase = environment.apiUrl;

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  }

  async uploadFile(file: File): Promise<string> {
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

    getRooms: (branchId?: string) =>
      this.request(`/public/rooms${branchId ? `?branch_id=${branchId}` : ''}`),
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
  };

  // Owner
  owner = {
    getDashboard: () => this.request('/owner/dashboard'),
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
  };

  // Tenant
  tenant = {
    getDashboard: () => this.request('/tenant/dashboard'),
    createBooking: (data: any) => this.request('/tenant/booking', { method: 'POST', body: JSON.stringify(data) }),
    getBookings: () => this.request('/tenant/booking'),
    getInvoices: () => this.request('/tenant/rent'),
    getComplaints: () => this.request('/tenant/complaints'),
    createComplaint: (data: any) => this.request('/tenant/complaints', { method: 'POST', body: JSON.stringify(data) }),
  };

  // Payments
  payments = {
    createRazorpayOrder: (amount: number, receipt?: string) =>
      this.request('/payments/razorpay/order', { method: 'POST', body: JSON.stringify({ amount, receipt }) }),
    verifyPayment: (data: any) =>
      this.request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),
  };
}
