import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { getInstantUpiQrUrl } from '../../../utils/upi-qr.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  private apiService = inject(ApiService);

  generalSettings: any = {
    id: '',
    branch_id: null,
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
    smtp_port: '',
  };
  generalSettingsLoading: boolean = false;
  generalSettingsSaving: boolean = false;
  generalSettingsSuccess: string = '';
  generalSettingsError: string = '';
  qrFile: File | null = null;
  qrPreview: string | null = null;
  apiUrl: string = environment.apiUrl || 'http://localhost:5000';
  showRazorpaySecret: boolean = false;
  showSmtpPassword: boolean = false;
  copiedUpi: boolean = false;

  ngOnInit() {
    this.loadGeneralSettings();
  }

  async loadGeneralSettings() {
    this.generalSettingsLoading = true;
    this.generalSettingsSuccess = '';
    this.generalSettingsError = '';
    try {
      const res = await this.apiService.admin.getGeneralSettings();
      const settingsData = res?.settings || res;
      if (settingsData && typeof settingsData === 'object') {
        const mailVal = settingsData.mail || settingsData.smtp_email || '';
        const userVal = settingsData.user_name || settingsData.smtp_username || '';
        const displayVal = settingsData.display_name || settingsData.smtp_display_name || '';
        const passVal = settingsData.password || settingsData.smtp_password || '';
        const hostVal = settingsData.host || settingsData.smtp_host || '';
        const portVal = settingsData.port || settingsData.smtp_port || '';

        this.generalSettings = {
          ...this.generalSettings,
          ...settingsData,
          razorpay_key: settingsData.razorpay_key || '',
          razorpay_secret: settingsData.razorpay_secret || '',
          upi_id: settingsData.upi_id || '',
          upi_qr_url: settingsData.upi_qr_url || '',
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
    } catch (err: any) {
      console.error('Failed to load platform settings:', err);
      this.generalSettingsError = 'Could not load settings. Please try again.';
    } finally {
      this.generalSettingsLoading = false;
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

  getSettingsUpiQrUrl(upiId: string): string {
    return getInstantUpiQrUrl({
      upiId,
      payeeName: 'StayPulse Platform',
      transactionNote: 'Platform Subscription',
    });
  }

  async saveGeneralSettings() {
    try {
      this.generalSettingsSaving = true;
      this.generalSettingsSuccess = '';
      this.generalSettingsError = '';

      const formData = new FormData();
      if (this.generalSettings.razorpay_key) formData.append('razorpay_key', this.generalSettings.razorpay_key);
      if (this.generalSettings.razorpay_secret) formData.append('razorpay_secret', this.generalSettings.razorpay_secret);
      if (this.generalSettings.upi_id) formData.append('upi_id', this.generalSettings.upi_id);

      const mail = this.generalSettings.mail || this.generalSettings.smtp_email;
      const user_name = this.generalSettings.user_name || this.generalSettings.smtp_username;
      const display_name = this.generalSettings.display_name || this.generalSettings.smtp_display_name;
      const password = this.generalSettings.password || this.generalSettings.smtp_password;
      const host = this.generalSettings.host || this.generalSettings.smtp_host;
      const port = this.generalSettings.port || this.generalSettings.smtp_port;

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

      const res = await this.apiService.admin.updateGeneralSettings(formData);
      const updated = res?.settings || res;
      if (updated && typeof updated === 'object') {
        const mailVal = updated.mail || updated.smtp_email || '';
        const userVal = updated.user_name || updated.smtp_username || '';
        const displayVal = updated.display_name || updated.smtp_display_name || '';
        const passVal = updated.password || updated.smtp_password || '';
        const hostVal = updated.host || updated.smtp_host || '';
        const portVal = updated.port || updated.smtp_port || '';

        this.generalSettings = {
          ...this.generalSettings,
          ...updated,
          razorpay_key: updated.razorpay_key || '',
          razorpay_secret: updated.razorpay_secret || '',
          upi_id: updated.upi_id || '',
          upi_qr_url: updated.upi_qr_url || '',
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
      this.generalSettingsSuccess = 'Platform General Settings saved successfully!';
      this.qrFile = null;
      setTimeout(() => {
        this.generalSettingsSuccess = '';
      }, 5000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      this.generalSettingsError = err.message || 'Failed to save settings. Please check your inputs.';
    } finally {
      this.generalSettingsSaving = false;
    }
  }

  copyUpiId(id: string) {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      this.copiedUpi = true;
      setTimeout(() => {
        this.copiedUpi = false;
      }, 2000);
    }).catch(() => {});
  }
}
