import { Component, Input, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-expenses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-expenses.component.html',
  styleUrl: './owner-expenses.component.css'
})
export class OwnerExpensesComponent {
  public authService = inject(AuthService);

  @Input() expenses: any[] = [];
}
