import { AuthService } from '../../../services/auth.service';
import { Component, Input, OnInit, OnChanges, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { BranchSettings } from '../../../models/types';
import { getInstantUpiQrUrl } from '../../../utils/upi-qr.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-settings.component.html',
  styleUrl: './owner-settings.component.css'
})
export class OwnerSettingsComponent implements OnInit, OnChanges {
  public authService = inject(AuthService);

  @Input() branchId!: string;
  private apiService = inject(ApiService);
  
  apiUrl = environment.apiUrl;
  settings: BranchSettings = {
    id: '',
    branch_id: '',
    razorpay_key: '',
    razorpay_secret: '',
    upi_id: '',
    upi_qr_url: '',
    mail: '',
    smtp_email: '',
    user_name: '',
    smtp_username: '',
    display_name: '',
    smtp_display_name: '',
    password: '',
    smtp_password: '',
    host: '',
    smtp_host: '',
    port: '',
    smtp_port: ''
  };
  
  qrFile: File | null = null;
  qrPreview: string | null = null;
  isLoading = false;

  ngOnInit() {
    if (this.branchId) {
      this.loadSettings();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['branchId'] && !changes['branchId'].firstChange) {
      this.loadSettings();
    }
  }

  async loadSettings() {
    try {
      this.isLoading = true;
      const res = await this.apiService.owner.getBranchSettings(this.branchId);
      if (res) {
        const mailVal = res.mail || res.smtp_email || '';
        const userVal = res.user_name || res.smtp_username || '';
        const displayVal = res.display_name || res.smtp_display_name || '';
        const passVal = res.password || res.smtp_password || '';
        const hostVal = res.host || res.smtp_host || '';
        const portVal = res.port || res.smtp_port || '';

        this.settings = {
          ...this.settings,
          ...res,
          mail: mailVal,
          smtp_email: mailVal,
          user_name: userVal,
          smtp_username: userVal,
          display_name: displayVal,
          smtp_display_name: displayVal,
          password: passVal,
          smtp_password: passVal,
          host: hostVal,
          smtp_host: hostVal,
          port: portVal,
          smtp_port: portVal,
        };
      }
    } catch (err) {
      console.error('Error loading settings', err);
    } finally {
      this.isLoading = false;
    }
  }

  getQrImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:image/')) return url;
    if (url.length > 100 && !url.startsWith('http') && !url.startsWith('/')) {
      return `data:image/png;base64,${url}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  getOwnerSettingsUpiQrUrl(upiId: string): string {
    return getInstantUpiQrUrl({
      upiId,
      payeeName: 'PG Living',
      transactionNote: 'Rent Settlement',
    });
  }

  async saveSettings() {
    try {
      this.isLoading = true;
      const formData = new FormData();
      formData.append('branch_id', this.branchId);
      if (this.settings.razorpay_key) formData.append('razorpay_key', this.settings.razorpay_key);
      if (this.settings.razorpay_secret) formData.append('razorpay_secret', this.settings.razorpay_secret);
      if (this.settings.upi_id) formData.append('upi_id', this.settings.upi_id);
      
      const mail = this.settings.mail || this.settings.smtp_email;
      const user_name = this.settings.user_name || this.settings.smtp_username;
      const display_name = this.settings.display_name || this.settings.smtp_display_name;
      const password = this.settings.password || this.settings.smtp_password;
      const host = this.settings.host || this.settings.smtp_host;
      const port = this.settings.port || this.settings.smtp_port;

      if (mail) {
        formData.append('mail', mail);
        formData.append('smtp_email', mail);
      }
      if (user_name) {
        formData.append('user_name', user_name);
        formData.append('smtp_username', user_name);
      }
      if (display_name) {
        formData.append('display_name', display_name);
        formData.append('smtp_display_name', display_name);
      }
      if (password) {
        formData.append('password', password);
        formData.append('smtp_password', password);
      }
      if (host) {
        formData.append('host', host);
        formData.append('smtp_host', host);
      }
      if (port) {
        formData.append('port', port);
        formData.append('smtp_port', port);
      }

      await this.apiService.owner.updateBranchSettings(this.branchId, formData);
      alert('Settings updated successfully!');
      this.loadSettings();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      this.isLoading = false;
    }
  }
}
