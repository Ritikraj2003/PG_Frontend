import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-owners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-owners.component.html',
  styleUrl: './admin-owners.component.css'
})
export class AdminOwnersComponent {
  @Input() owners: any[] = [];

  @Output() registerOwner = new EventEmitter<void>();
  @Output() viewOwner = new EventEmitter<any>();
  @Output() editOwner = new EventEmitter<any>();
  @Output() addBranch = new EventEmitter<any>();
  @Output() deleteOwner = new EventEmitter<any>();
}
