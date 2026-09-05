import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.css'
})
export class AdminReportsComponent {
  @Input() reports: any = null;
  @Input() owners: any[] = [];
  @Input() properties: any[] = [];
  @Input() branches: any[] = [];
}
