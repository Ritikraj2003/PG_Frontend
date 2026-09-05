import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  @Input() activeTab: string = 'overview';
  @Input() ownersCount: number = 0;
  @Input() propertiesCount: number = 0;
  @Input() branchesCount: number = 0;
  @Input() plansCount: number = 0;
  @Input() isMobileOpen: boolean = false;

  @Output() selectTab = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  onTabClick(tab: string) {
    this.selectTab.emit(tab);
    this.closeMobile.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMobile.emit();
  }
}
