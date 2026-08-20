import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { OwnerSidebarComponent } from '../sidebar/owner-sidebar.component';
import { OwnerRoomsComponent } from '../rooms/owner-rooms.component';
import { OwnerBookingsComponent } from '../bookings/owner-bookings.component';
import { OwnerInvoicesComponent } from '../invoices/owner-invoices.component';
import { OwnerExpensesComponent } from '../expenses/owner-expenses.component';
import { OwnerTenantsComponent } from '../tenants/owner-tenants.component';

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
    OwnerExpensesComponent,
    OwnerTenantsComponent
  ],
  templateUrl: './owner-dashboard.component.html',
  styleUrl: './owner-dashboard.component.css',
})
export class OwnerDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  dashboard: any = null;
  branches: any[] = [];
  selectedBranchId = '';

  rooms: any[] = [];
  bookings: any[] = [];
  invoices: any[] = [];
  expenses: any[] = [];
  tenants: any[] = [];

  activeTab: 'dashboard' | 'rooms' | 'bookings' | 'invoices' | 'expenses' | 'tenants' = 'dashboard';
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

  setActiveTab(tab: 'dashboard' | 'rooms' | 'bookings' | 'invoices' | 'expenses' | 'tenants') {
    this.activeTab = tab;
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

  handleLogout() {
    this.authService.logout();
  }
}

