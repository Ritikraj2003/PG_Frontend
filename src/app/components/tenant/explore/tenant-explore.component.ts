import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicBrowserComponent } from '../../public-browser/public-browser.component';

@Component({
  selector: 'app-tenant-explore',
  standalone: true,
  imports: [CommonModule, PublicBrowserComponent],
  templateUrl: './tenant-explore.component.html',
  styleUrl: './tenant-explore.component.css',
})
export class TenantExploreComponent {}
