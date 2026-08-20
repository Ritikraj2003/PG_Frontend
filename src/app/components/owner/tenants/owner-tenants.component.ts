import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-tenants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-tenants.component.html',
  styleUrl: './owner-tenants.component.css'
})
export class OwnerTenantsComponent {
  @Input() tenants: any[] = [];
}
