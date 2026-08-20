import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-expenses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-expenses.component.html',
  styleUrl: './owner-expenses.component.css'
})
export class OwnerExpensesComponent {
  @Input() expenses: any[] = [];
}
