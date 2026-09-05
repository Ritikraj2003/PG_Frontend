import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Permission, CustomRole, StaffMember, Branch } from '../../../models/types';

@Component({
  selector: 'app-owner-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-roles.component.html',
  styleUrl: './owner-roles.component.css'
})
export class OwnerRolesComponent implements OnInit {
  @Input() branchId = '';

  private api = inject(ApiService);
  public authService = inject(AuthService);

  activeSubTab: 'roles' | 'staff' = 'roles';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Master Data
  permissions: Permission[] = [];
  roles: CustomRole[] = [];
  staffList: StaffMember[] = [];
  branches: Branch[] = [];

  // Role Modal State
  showRoleModal = false;
  isEditingRole = false;
  editingRoleId: number | null = null;
  roleForm = {
    name: '',
    is_active: true
  };

  // Dual Listbox (Transfer Picker) State
  searchAvailable = '';
  selectedAvailableIds = new Set<number>();
  selectedChosenIds = new Set<number>();
  chosenPermissionIds = new Set<number>();

  // Staff Modal State
  showStaffModal = false;
  isEditingStaff = false;
  editingStaffId: string | null = null;
  staffForm = {
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
    role_id: 0,
    branch_id: ''
  };

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await Promise.all([
        this.loadPermissions(),
        this.loadRoles(),
        this.loadStaff(),
        this.loadBranches()
      ]);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to load roles and permissions';
    } finally {
      this.isLoading = false;
    }
  }

  async loadPermissions() {
    try {
      const res = await this.api.owner.getPermissions();
      this.permissions = res.data || [];
    } catch (err: any) {
      console.error('Error loading permissions:', err);
    }
  }

  async loadRoles() {
    try {
      const res = await this.api.owner.getRoles();
      this.roles = res.data || [];
    } catch (err: any) {
      console.error('Error loading roles:', err);
    }
  }

  async loadStaff() {
    try {
      const res = await this.api.owner.getTeam();
      this.staffList = res.data || [];
    } catch (err: any) {
      console.error('Error loading staff:', err);
    }
  }

  async loadBranches() {
    try {
      const res = await this.api.owner.getBranches();
      this.branches = res.data || [];
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  }

  // Permission Label Formatter matching the screenshot format: Module | Sub-Module/Action
  formatPermissionLabel(p: Permission): string {
    if (p.permission_name.includes('|')) return p.permission_name;

    const mapping: { [key: string]: string } = {
      'DASH': 'System | Dashboard | View Dashboard',
      'RMS_VIEW': 'Rooms | View Rooms Directory',
      'RMS_ADD': 'Rooms | Add New Room',
      'RMS_EDIT': 'Rooms | Edit Room & Beds',
      'RMS_DEL': 'Rooms | Delete Room & Beds',
      'BKG_VIEW': 'Bookings | View Bookings',
      'BKG_ADD': 'Bookings | Create Booking',
      'BKG_EDIT': 'Bookings | Approve / Reject Booking',
      'BKG_DEL': 'Bookings | Cancel Booking',
      'INV_VIEW': 'Invoices | View Rent Invoices',
      'INV_ADD': 'Invoices | Generate Bulk & Single Invoices',
      'INV_EDIT': 'Invoices | Edit Invoice Amounts',
      'INV_DEL': 'Invoices | Delete Invoice',
      'PYT_VIEW': 'Payments | View Payments List',
      'PYT_ADD': 'Payments | Record Manual Payment',
      'PYT_EDIT': 'Payments | Verify Payment',
      'PYT_DEL': 'Payments | Delete Payment Entry',
      'EXP_VIEW': 'Expenses | View Expenses',
      'EXP_ADD': 'Expenses | Add Branch Expense',
      'EXP_EDIT': 'Expenses | Edit Expense Details',
      'EXP_DEL': 'Expenses | Delete Expense',
      'TNT_VIEW': 'Tenants | View Tenants & Users',
      'TNT_ADD': 'Tenants | Add New Tenant',
      'TNT_EDIT': 'Tenants | Edit Tenant Details',
      'TNT_DEL': 'Tenants | Check Out Tenant',
      'SET_VIEW': 'Settings | Branch Settings | View Settings',
      'SET_EDIT': 'Settings | Branch Settings | Edit Settings',
      'ROL_VIEW': 'System | Roles & Permissions | View Roles & Permissions',
      'ROL_MANAGE': 'System | Roles & Permissions | Add Roles & Permissions'
    };

    return mapping[p.permission_code] || `${p.permission_name} | ${p.permission_code}`;
  }

  // Available permissions: not in chosen, filtered by search
  get availableList(): Permission[] {
    const search = this.searchAvailable.toLowerCase().trim();
    return this.permissions.filter(p => {
      if (this.chosenPermissionIds.has(Number(p.id))) return false;
      if (!search) return true;
      const label = this.formatPermissionLabel(p).toLowerCase();
      return label.includes(search) || p.permission_code.toLowerCase().includes(search);
    });
  }

  // Chosen permissions list
  get chosenList(): Permission[] {
    return this.permissions.filter(p => this.chosenPermissionIds.has(Number(p.id)));
  }

  // Transfer Actions
  toggleAvailableSelection(permId: number) {
    const id = Number(permId);
    if (this.selectedAvailableIds.has(id)) {
      this.selectedAvailableIds.delete(id);
    } else {
      this.selectedAvailableIds.add(id);
    }
  }

  toggleChosenSelection(permId: number) {
    const id = Number(permId);
    if (this.selectedChosenIds.has(id)) {
      this.selectedChosenIds.delete(id);
    } else {
      this.selectedChosenIds.add(id);
    }
  }

  moveSelectedToChosen() {
    this.selectedAvailableIds.forEach(id => this.chosenPermissionIds.add(id));
    this.selectedAvailableIds.clear();
  }

  moveSelectedToAvailable() {
    this.selectedChosenIds.forEach(id => this.chosenPermissionIds.delete(id));
    this.selectedChosenIds.clear();
  }

  chooseAll() {
    this.availableList.forEach(p => this.chosenPermissionIds.add(Number(p.id)));
    this.selectedAvailableIds.clear();
  }

  removeAll() {
    this.chosenPermissionIds.clear();
    this.selectedChosenIds.clear();
  }

  quickMoveToChosen(permId: number) {
    this.chosenPermissionIds.add(Number(permId));
    this.selectedAvailableIds.delete(Number(permId));
  }

  quickMoveToAvailable(permId: number) {
    this.chosenPermissionIds.delete(Number(permId));
    this.selectedChosenIds.delete(Number(permId));
  }

  // Role Actions
  openCreateRoleModal() {
    this.isEditingRole = false;
    this.editingRoleId = null;
    this.roleForm = { name: '', is_active: true };
    this.chosenPermissionIds.clear();
    this.selectedAvailableIds.clear();
    this.selectedChosenIds.clear();
    this.searchAvailable = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showRoleModal = true;
  }

  openEditRoleModal(role: CustomRole) {
    this.isEditingRole = true;
    this.editingRoleId = role.id;
    this.roleForm = {
      name: role.name,
      is_active: role.is_active !== undefined ? role.is_active : true
    };
    this.chosenPermissionIds = new Set((role.permission_ids || []).map(Number));
    this.selectedAvailableIds.clear();
    this.selectedChosenIds.clear();
    this.searchAvailable = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
  }

  async saveRole() {
    if (!this.roleForm.name.trim()) {
      this.errorMessage = 'Please enter a role name';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    try {
      const payload = {
        name: this.roleForm.name.trim(),
        is_active: this.roleForm.is_active,
        permission_ids: Array.from(this.chosenPermissionIds)
      };

      if (this.isEditingRole && this.editingRoleId) {
        await this.api.owner.updateRole(this.editingRoleId, payload);
        this.successMessage = 'Role updated successfully!';
      } else {
        await this.api.owner.createRole(payload);
        this.successMessage = 'Role created successfully!';
      }

      this.closeRoleModal();
      await this.loadRoles();
      setTimeout(() => (this.successMessage = ''), 4000);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to save role';
    } finally {
      this.isLoading = false;
    }
  }

  async deleteRole(role: CustomRole) {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    try {
      await this.api.owner.deleteRole(role.id);
      this.successMessage = 'Role deleted successfully!';
      await this.loadRoles();
      setTimeout(() => (this.successMessage = ''), 4000);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to delete role';
    } finally {
      this.isLoading = false;
    }
  }

  // Staff Actions
  openCreateStaffModal() {
    this.isEditingStaff = false;
    this.editingStaffId = null;
    this.staffForm = {
      full_name: '',
      email: '',
      mobile_number: '',
      password: '',
      role_id: this.roles.length > 0 ? this.roles[0].id : 0,
      branch_id: this.branchId || (this.branches.length > 0 ? this.branches[0].id : '')
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.showStaffModal = true;
  }

  openEditStaffModal(staff: StaffMember) {
    this.isEditingStaff = true;
    this.editingStaffId = staff.id;
    this.staffForm = {
      full_name: staff.full_name,
      email: staff.email,
      mobile_number: staff.mobile_number,
      password: '',
      role_id: staff.role_id || (this.roles.length > 0 ? this.roles[0].id : 0),
      branch_id: staff.branch_id || ''
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.showStaffModal = true;
  }

  closeStaffModal() {
    this.showStaffModal = false;
  }

  async saveStaff() {
    if (!this.staffForm.full_name.trim() || !this.staffForm.email.trim() || !this.staffForm.mobile_number.trim()) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    if (!this.isEditingStaff && !this.staffForm.password.trim()) {
      this.errorMessage = 'Password is required for new staff member';
      return;
    }

    if (!this.staffForm.role_id) {
      this.errorMessage = 'Please select a role';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    try {
      if (this.isEditingStaff && this.editingStaffId) {
        const payload: any = {
          full_name: this.staffForm.full_name.trim(),
          mobile_number: this.staffForm.mobile_number.trim(),
          role_id: this.staffForm.role_id,
          branch_id: this.staffForm.branch_id || undefined
        };
        if (this.staffForm.password.trim()) {
          payload.password = this.staffForm.password.trim();
        }
        await this.api.owner.updateStaff(this.editingStaffId, payload);
        this.successMessage = 'Staff member updated successfully!';
      } else {
        await this.api.owner.createStaff({
          full_name: this.staffForm.full_name.trim(),
          email: this.staffForm.email.trim(),
          mobile_number: this.staffForm.mobile_number.trim(),
          password: this.staffForm.password.trim(),
          role_id: this.staffForm.role_id,
          branch_id: this.staffForm.branch_id || undefined
        });
        this.successMessage = 'Staff member created successfully!';
      }

      this.closeStaffModal();
      await this.loadStaff();
      setTimeout(() => (this.successMessage = ''), 4000);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to save staff member';
    } finally {
      this.isLoading = false;
    }
  }

  async toggleStaffStatus(staff: StaffMember) {
    this.isLoading = true;
    try {
      await this.api.owner.updateStaff(staff.id, { is_active: !staff.is_active });
      staff.is_active = !staff.is_active;
      this.successMessage = `Staff member ${staff.is_active ? 'activated' : 'deactivated'} successfully!`;
      setTimeout(() => (this.successMessage = ''), 3000);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to update status';
    } finally {
      this.isLoading = false;
    }
  }

  async deleteStaff(staff: StaffMember) {
    if (!confirm(`Are you sure you want to remove ${staff.full_name} from staff?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.api.owner.deleteStaff(staff.id);
      this.successMessage = 'Staff member removed successfully!';
      await this.loadStaff();
      setTimeout(() => (this.successMessage = ''), 4000);
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to delete staff member';
    } finally {
      this.isLoading = false;
    }
  }
}
