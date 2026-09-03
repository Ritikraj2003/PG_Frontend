import { Component, Input, OnInit, OnChanges, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { BranchSettings } from '../../../models/types';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-settings.component.html',
  styleUrl: './owner-settings.component.css'
})
export class OwnerSettingsComponent implements OnInit, OnChanges {
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
    smtp_email: '',
    smtp_password: ''
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
        this.settings = { ...this.settings, ...res };
      }
    } catch (err) {
      console.error('Error loading settings', err);
    } finally {
      this.isLoading = false;
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.qrFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.qrPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveSettings() {
    try {
      this.isLoading = true;
      const formData = new FormData();
      formData.append('branch_id', this.branchId);
      if (this.settings.razorpay_key) formData.append('razorpay_key', this.settings.razorpay_key);
      if (this.settings.razorpay_secret) formData.append('razorpay_secret', this.settings.razorpay_secret);
      if (this.settings.upi_id) formData.append('upi_id', this.settings.upi_id);
      if (this.settings.smtp_email) formData.append('smtp_email', this.settings.smtp_email);
      if (this.settings.smtp_password) formData.append('smtp_password', this.settings.smtp_password);
      
      if (this.qrFile) {
        formData.append('upi_qr', this.qrFile);
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
