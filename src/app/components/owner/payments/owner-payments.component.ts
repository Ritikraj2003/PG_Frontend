import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-payments.component.html',
  styleUrl: './owner-payments.component.css'
})
export class OwnerPaymentsComponent implements OnInit, OnChanges {
  @Input() branchId!: string;
  private apiService = inject(ApiService);
  
  apiUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  payments: any[] = [];
  isLoading = false;

  previewPayment: any = null;
  verifyRemarks: string = '';
  isVerifying = false;

  ngOnInit() {
    if (this.branchId) {
      this.loadPayments();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['branchId'] && !changes['branchId'].firstChange) {
      this.loadPayments();
    }
  }

  async loadPayments() {
    try {
      this.isLoading = true;
      this.payments = await this.apiService.owner.getPayments(this.branchId);
    } catch (err) {
      console.error('Error loading payments', err);
    } finally {
      this.isLoading = false;
    }
  }

  openVerifyModal(payment: any) {
    this.previewPayment = payment;
    this.verifyRemarks = '';
  }

  closeVerifyModal() {
    this.previewPayment = null;
    this.verifyRemarks = '';
  }

  async verifyPayment(status: 'SUCCESS' | 'FAILED') {
    if (!this.previewPayment) return;
    try {
      this.isVerifying = true;
      await this.apiService.owner.verifyManualPayment(this.previewPayment.id, status, this.verifyRemarks);
      alert('Payment verified successfully');
      this.closeVerifyModal();
      this.loadPayments();
    } catch (err: any) {
      alert(`Error verifying payment: ${err.message}`);
    } finally {
      this.isVerifying = false;
    }
  }
}
