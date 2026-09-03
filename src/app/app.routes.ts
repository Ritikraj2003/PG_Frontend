import { Routes } from '@angular/router';
import { PublicBrowserComponent } from './components/public-browser/public-browser.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { OwnerDashboardComponent } from './components/owner/dashboard/owner-dashboard.component';
import { TenantDashboardComponent } from './components/tenant-dashboard/tenant-dashboard.component';
import { adminGuard, ownerGuard, tenantGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'browse', pathMatch: 'full' },
  { path: 'browse', component: PublicBrowserComponent },

  // Admin Portal Routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'overview', component: AdminDashboardComponent },
      { path: 'owners', component: AdminDashboardComponent },
      { path: 'properties', component: AdminDashboardComponent },
      { path: 'branches', component: AdminDashboardComponent },
      { path: 'users', component: AdminDashboardComponent },
    ],
  },

  // Owner Portal Routes
  {
    path: 'owner',
    canActivate: [ownerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OwnerDashboardComponent },
      { path: 'rooms', component: OwnerDashboardComponent },
      { path: 'bookings', component: OwnerDashboardComponent },
      { path: 'invoices', component: OwnerDashboardComponent },
      { path: 'payments', component: OwnerDashboardComponent },
      { path: 'expenses', component: OwnerDashboardComponent },
      { path: 'tenants', component: OwnerDashboardComponent },
      { path: 'settings', component: OwnerDashboardComponent },
    ],
  },

  // Tenant Portal Routes
  {
    path: 'tenant',
    canActivate: [tenantGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TenantDashboardComponent },
      { path: 'overview', component: TenantDashboardComponent },
      { path: 'explore', component: TenantDashboardComponent },
      { path: 'property', component: TenantDashboardComponent },
      { path: 'bookings', component: TenantDashboardComponent },
      { path: 'invoices', component: TenantDashboardComponent },
      { path: 'complaints', component: TenantDashboardComponent },
    ],
  },

  { path: '**', redirectTo: 'browse' },
];
