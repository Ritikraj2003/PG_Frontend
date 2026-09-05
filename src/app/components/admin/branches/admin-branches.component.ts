import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-branches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-branches.component.html',
  styleUrl: './admin-branches.component.css'
})
export class AdminBranchesComponent {
  @Input() branches: any[] = [];

  @Output() editBranch = new EventEmitter<any>();
  @Output() deleteBranch = new EventEmitter<any>();
  @Output() renewBranch = new EventEmitter<any>();
}
