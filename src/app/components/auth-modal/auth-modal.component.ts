import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/types';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.css',
})
export class AuthModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<{ user: User; token: string }>();

  private apiService = inject(ApiService);

  mode: 'login' | 'register' = 'login';
  showPassword = false;
  activeQuickRole: 'admin' | 'owner' | 'tenant' | null = null;
  emailOrMobile = '';
  password = '';

  fullName = '';
  email = '';
  mobileNumber = '';
  role = 'USER';
  selectedBranchId = '';
  availableProperties: any[] = [];

  error: string | null = null;
  loading = false;

  async loadPropertiesIfNeeded() {
    if (this.availableProperties.length === 0) {
      try {
        this.availableProperties = await this.apiService.public.getProperties();
      } catch (e) {
        console.error(e);
      }
    }
  }

  setMode(newMode: 'login' | 'register') {
    this.mode = newMode;
    this.error = null;
    if (newMode === 'register') {
      this.loadPropertiesIfNeeded();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  quickFill(type: 'admin' | 'owner' | 'tenant') {
    this.activeQuickRole = type;
    if (type === 'admin') {
      this.emailOrMobile = 'admin@pgmanagement.com';
      this.password = 'admin123';
    } else if (type === 'owner') {
      this.emailOrMobile = 'owner@comfortstays.com';
      this.password = 'owner123';
    } else if (type === 'tenant') {
      this.emailOrMobile = 'tenant@gmail.com';
      this.password = 'tenant123';
    }
  }

  async handleLogin() {
    this.error = null;
    this.loading = true;
    try {
      const data = await this.apiService.auth.login({
        emailOrMobile: this.emailOrMobile,
        password: this.password,
      });
      this.loginSuccess.emit({ user: data.user, token: data.accessToken });
      this.close.emit();
    } catch (err: any) {
      this.error = err.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async handleRegister() {
    this.error = null;
    this.loading = true;
    try {
      const data = await this.apiService.auth.register({
        full_name: this.fullName,
        email: this.email,
        mobile_number: this.mobileNumber,
        password: this.password,
        role: this.role,
        branch_id: this.selectedBranchId || undefined,
      });
      this.loginSuccess.emit({ user: data.user, token: data.accessToken });
      this.close.emit();
    } catch (err: any) {
      this.error = err.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }
}
