import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
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
    smtp_email: '',
    smtp_password: '',
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
      if (res && res.settings) {
        this.generalSettings = {
          ...this.generalSettings,
          ...res.settings,
        };
      }
    } catch (err: any) {
      console.error('Failed to load platform settings:', err);
      this.generalSettingsError = 'Could not load settings. Please try again.';
    } finally {
      this.generalSettingsLoading = false;
    }
  }

  onQrFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.qrFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.qrPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
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
      if (this.generalSettings.smtp_email) formData.append('smtp_email', this.generalSettings.smtp_email);
      if (this.generalSettings.smtp_password) formData.append('smtp_password', this.generalSettings.smtp_password);
      if (this.qrFile) {
        formData.append('upi_qr', this.qrFile);
      }

      const res = await this.apiService.admin.updateGeneralSettings(formData);
      if (res) {
        this.generalSettings = {
          ...this.generalSettings,
          ...res,
          razorpay_key: res.razorpay_key || '',
          razorpay_secret: res.razorpay_secret || '',
          upi_id: res.upi_id || '',
          upi_qr_url: res.upi_qr_url || '',
          smtp_email: res.smtp_email || '',
          smtp_password: res.smtp_password || '',
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
