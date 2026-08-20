export type RoleType = 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | 'TENANT';

export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  roles: RoleType[];
}

export interface Property {
  id: string;
  property_name: string;
  property_type: 'PG' | 'RENTAL_HOUSE';
  description?: string;
  address: string;
  city: string;
  state: string;
  owner_business_name?: string;
  total_branches?: number;
}

export interface Branch {
  id: string;
  property_id: string;
  branch_code: string;
  branch_name: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  contact_number: string;
}

export interface Room {
  id: string;
  branch_id: string;
  room_number: string;
  room_name?: string;
  monthly_rent: number;
  security_deposit: number;
  status: 'AVAILABLE' | 'PARTIALLY_OCCUPIED' | 'FULLY_OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  available_beds?: number;
  total_beds?: number;
  property_name?: string;
  branch_name?: string;
  room_type_name?: string;
}
