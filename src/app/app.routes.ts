import { Routes } from '@angular/router';
import { PublicBrowserComponent } from './components/public-browser/public-browser.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { OwnerDashboardComponent } from './components/owner/dashboard/owner-dashboard.component';
import { TenantDashboardComponent } from './components/tenant-dashboard/tenant-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'browse', pathMatch: 'full' },
  { path: 'browse', component: PublicBrowserComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'owner', component: OwnerDashboardComponent },
  { path: 'tenant', component: TenantDashboardComponent },
  { path: '**', redirectTo: 'browse' },
];
