import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.css'
})
export class AdminPropertiesComponent {
  @Input() owners: any[] = [];
  @Input() properties: any[] = [];
}
