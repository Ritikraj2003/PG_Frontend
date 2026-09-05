export type RoleType = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'STAFF' | 'USER';

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  max_branches: number;
  features?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id?: string;
  owner_id?: string;
  property_id?: string;
  branch_id?: string;
  plan_id?: string;
  plan_name: string;
  duration_months: number;
  max_branches?: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'NO_SUBSCRIPTION';
  is_expired: boolean;
  days_remaining: number;
  price?: number;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  roles: RoleType[];
  subscription?: Subscription | null;
}

export interface Property {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  owner_name?: string;
}

export interface Branch {
  id: string;
  property_id: string;
  name: string;
  branch_name?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  contact_number: string;
  amenities?: string[];
  property_name?: string;
  owner_name?: string;
  owner_email?: string;
  subscription_id?: string;
  plan_id?: string;
  plan_name?: string;
  duration_months?: number;
  subscription_price?: number;
  start_date?: string;
  end_date?: string;
  subscription_status?: string;
  is_expired?: boolean;
  days_remaining?: number;
}

export interface BranchSettings {
  id: string;
  branch_id: string;
  razorpay_key?: string;
  razorpay_secret?: string;
  upi_id?: string;
  upi_qr_url?: string;
  smtp_email?: string;
  smtp_password?: string;
}

export interface Room {
  id: string;
  branch_id: string;
  floor_number: number;
  room_number: string;
  room_type: string;
  monthly_rent: number;
  security_deposit: number;
  status: 'AVAILABLE' | 'PARTIALLY_OCCUPIED' | 'FULLY_OCCUPIED' | 'MAINTENANCE';
  available_beds?: number;
  total_beds?: number;
  property_name?: string;
  branch_name?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  branch_id: string;
  room_id: string;
  bed_id?: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CHECKED_OUT' | 'CANCELLED';
  created_at: string;
  full_name?: string;
  email?: string;
  mobile_number?: string;
  room_number?: string;
  room_type?: string;
  monthly_rent?: number;
  security_deposit?: number;
  bed_number?: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  branch_id: string;
  booking_id: string;
  tenant_code: string;
  status: 'ACTIVE' | 'CHECKED_OUT';
  full_name?: string;
  mobile_number?: string;
}

export interface RentInvoice {
  id: string;
  branch_id: string;
  tenant_id: string;
  invoice_month: string;
  due_date: string;
  rent_amount: number;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  tenant_name?: string;
  mobile_number?: string;
  tenant_code?: string;
}

export interface Payment {
  id: string;
  branch_id: string;
  user_id: string;
  booking_id?: string;
  invoice_id?: string;
  amount: number;
  payment_method: 'RAZORPAY' | 'MANUAL_QR' | 'CASH';
  status: 'PENDING_VERIFICATION' | 'SUCCESS' | 'FAILED';
  screenshot_url?: string;
  reference_number?: string;
  remarks?: string;
  user_name?: string;
}