import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan } from '../../../models/types';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-plans.component.html',
  styleUrl: './admin-plans.component.css'
})
export class AdminPlansComponent {
  @Input() plans: SubscriptionPlan[] = [];

  @Output() createPlan = new EventEmitter<void>();
  @Output() editPlan = new EventEmitter<SubscriptionPlan>();
  @Output() deletePlan = new EventEmitter<SubscriptionPlan>();
}
