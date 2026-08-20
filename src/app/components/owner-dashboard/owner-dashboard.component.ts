import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrl: './owner-dashboard.component.css',
})
export class OwnerDashboardComponent implements OnInit {
  private apiService = inject(ApiService);

  dashboard: any = null;
  branches: any[] = [];
  selectedBranchId = '';

  rooms: any[] = [];
  bookings: any[] = [];
  invoices: any[] = [];
  expenses: any[] = [];
  tenants: any[] = [];

  activeTab: 'rooms' | 'bookings' | 'invoices' | 'expenses' | 'tenants' = 'rooms';
  loadedTabs = new Set<string>();
  showRoomModal = false;

  ngOnInit() {
    this.fetchDashboard();
  }

  async fetchDashboard() {
    try {
      this.dashboard = await this.apiService.owner.getDashboard();
      if (this.dashboard.branches && this.dashboard.branches.length > 0) {
        this.branches = this.dashboard.branches;
        this.selectedBranchId = this.branches[0].id;
        this.onBranchChange();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async onBranchChange() {
    if (!this.selectedBranchId) return;
    this.rooms = [];
    this.bookings = [];
    this.invoices = [];
    this.expenses = [];
    this.tenants = [];
    this.loadedTabs.clear();
    await this.loadActiveTabData();
  }

  setActiveTab(tab: 'rooms' | 'bookings' | 'invoices' | 'expenses' | 'tenants') {
    this.activeTab = tab;
    this.loadActiveTabData();
  }

  async loadActiveTabData() {
    if (!this.selectedBranchId) return;
    try {
      if (this.activeTab === 'rooms' && !this.loadedTabs.has('rooms')) {
        this.rooms = await this.apiService.owner.getRooms(this.selectedBranchId);
        this.loadedTabs.add('rooms');
      } else if (this.activeTab === 'bookings' && !this.loadedTabs.has('bookings')) {
        this.bookings = await this.apiService.owner.getBookings(this.selectedBranchId);
        this.loadedTabs.add('bookings');
      } else if (this.activeTab === 'invoices' && !this.loadedTabs.has('invoices')) {
        this.invoices = await this.apiService.owner.getRentInvoices(this.selectedBranchId);
        this.loadedTabs.add('invoices');
      } else if (this.activeTab === 'expenses' && !this.loadedTabs.has('expenses')) {
        this.expenses = await this.apiService.owner.getExpenses(this.selectedBranchId);
        this.loadedTabs.add('expenses');
      } else if (this.activeTab === 'tenants' && !this.loadedTabs.has('tenants')) {
        this.tenants = await this.apiService.owner.getTenants(this.selectedBranchId);
        this.loadedTabs.add('tenants');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async updateBooking(id: string, status: string) {
    try {
      await this.apiService.owner.updateBookingStatus(id, status);
      alert('Booking status updated!');
      this.loadedTabs.delete('bookings');
      this.loadActiveTabData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }
}
