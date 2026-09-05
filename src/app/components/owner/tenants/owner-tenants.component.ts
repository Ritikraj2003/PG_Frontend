import { Component, Input, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-tenants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-tenants.component.html',
  styleUrl: './owner-tenants.component.css'
})
export class OwnerTenantsComponent {
  public authService = inject(AuthService);

  @Input() tenants: any[] = [];
}
