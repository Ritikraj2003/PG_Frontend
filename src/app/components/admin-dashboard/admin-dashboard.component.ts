import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private apiService = inject(ApiService);

  reports: any = null;
  owners: any[] = [];
  properties: any[] = [];
  branches: any[] = [];

  selectedOwner: any = null;
  selectedOwnerBranches: any[] = [];

  showCreateOwnerModal = false;
  showViewModal = false;
  showEditOwnerModal = false;
  showEditBranchModal = false;
  showAddBranchModal = false;

  ownerData = {
    full_name: '',
    email: '',
    mobile_number: '',
    password: 'owner123',
    owner_code: '',
    business_name: '',
    contact_number: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    property_type: 'PG',
    property_name: '',
    logo: '',
    description: '',
    kyc_doc_type: 'Aadhaar Card',
    kyc_doc_number: '',
    kyc_doc_url: '',
  };

  editOwnerData = {
    id: '',
    full_name: '',
    business_name: '',
    email: '',
    contact_number: '',
    address: '',
    city: 'Bengaluru',
    property_name: '',
    property_type: 'PG',
  };

  editBranchData = {
    id: '',
    branch_name: '',
    address: '',
    city: '',
    contact_number: '',
  };

  branchData = {
    property_id: '',
    branch_name: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    contact_number: '',
  };

  activeTab: string = 'overview';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onLogout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/';
  }

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    try {
      const [reportsData, ownersData, propertiesData, branchesData] = await Promise.all([
        this.apiService.admin.getReports(),
        this.apiService.admin.getOwners(),
        this.apiService.admin.getProperties().catch(() => []),
        this.apiService.admin.getBranches().catch(() => []),
      ]);
      this.reports = reportsData;
      this.owners = ownersData;
      this.properties = propertiesData;
      this.branches = branchesData;

      if (this.selectedOwner) {
        const freshOwner = this.owners.find(o => o.id === this.selectedOwner.id);
        if (freshOwner) {
          this.selectedOwner = freshOwner;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  logoFileName = '';
  kycFileName = '';
  selectedLogoFile: File | null = null;
  selectedKycFile: File | null = null;

  onLogoFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.logoFileName = file.name;
      this.selectedLogoFile = file;
    }
  }

  onKycFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.kycFileName = file.name;
      this.selectedKycFile = file;
    }
  }

  // --- CREATE OWNER ---
  openCreateOwnerModal() {
    this.logoFileName = '';
    this.kycFileName = '';
    this.selectedLogoFile = null;
    this.selectedKycFile = null;
    this.ownerData = {
      full_name: '',
      email: '',
      mobile_number: '',
      password: 'owner123',
      owner_code: '',
      business_name: '',
      contact_number: '',
      address: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '',
      property_type: 'PG',
      property_name: '',
      logo: '',
      description: '',
      kyc_doc_type: 'Aadhaar Card',
      kyc_doc_number: '',
      kyc_doc_url: '',
    };
    this.showCreateOwnerModal = true;
  }

  async createOwner() {
    try {
      this.ownerData.contact_number = this.ownerData.mobile_number;
      this.ownerData.property_name = this.ownerData.business_name;

      const formData = new FormData();
      Object.keys(this.ownerData).forEach((key) => {
        const val = (this.ownerData as any)[key];
        if (val !== undefined && val !== null && val !== '') {
          formData.append(key, val);
        }
      });

      if (this.selectedLogoFile) {
        formData.append('logo', this.selectedLogoFile);
      }
      if (this.selectedKycFile) {
        formData.append('kyc_doc', this.selectedKycFile);
      }

      await this.apiService.admin.createOwner(formData);
      alert('Owner & Property account created successfully!');
      this.showCreateOwnerModal = false;
      this.fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }

  // --- VIEW / EDIT / DELETE OWNER ---

  async viewOwnerDetails(owner: any) {
    this.selectedOwner = owner;
    this.showViewModal = true;
    this.selectedOwnerBranches = [];

    const prop = this.properties.find(p => p.owner_id === owner.id);
    if (prop) {
      try {
        const branches = await this.apiService.admin.getBranches();
        this.selectedOwnerBranches = branches.filter((b: any) => b.property_id === prop.id);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async openEditOwnerModal(owner: any) {
    let propName = owner.property_name || '';
    let propType = owner.property_type || 'PG';

    if (!propName) {
      try {
        const properties = await this.apiService.admin.getProperties();
        const prop = properties.find((p: any) => p.owner_id === owner.id);
        if (prop) {
          propName = prop.property_name;
          propType = prop.property_type;
        }
      } catch (err) {
        console.error(err);
      }
    }

    this.editOwnerData = {
      id: owner.id,
      full_name: owner.full_name || '',
      business_name: owner.full_name || '',
      email: owner.email || '',
      contact_number: owner.contact_number || owner.mobile_number || '',
      address: owner.address || '',
      city: owner.city || 'Bengaluru',
      property_name: propName,
      property_type: propType,
    };
    this.showEditOwnerModal = true;
  }

  async updateOwner() {
    try {
      await this.apiService.admin.updateOwner(this.editOwnerData.id, {
        full_name: this.editOwnerData.full_name,
        business_name: this.editOwnerData.business_name,
        email: this.editOwnerData.email,
        contact_number: this.editOwnerData.contact_number,
        address: this.editOwnerData.address,
        city: this.editOwnerData.city,
        property_name: this.editOwnerData.property_name,
        property_type: this.editOwnerData.property_type,
      });
      alert('Owner & Property details updated successfully!');
      this.showEditOwnerModal = false;
      this.fetchData();
    } catch (err: any) {
      alert(`Error updating details: ${err.message}`);
    }
  }

  async deleteOwner(owner: any) {
    if (confirm(`Are you sure you want to delete "${owner.full_name}"?\nThis will remove all associated properties and branches!`)) {
      try {
        await this.apiService.admin.deleteOwner(owner.id);
        alert('Owner deleted successfully!');
        this.fetchData();
      } catch (err: any) {
        alert(`Error deleting owner: ${err.message}`);
      }
    }
  }

  // --- BRANCH ACTIONS ---

  openEditBranchModal(branch: any) {
    this.editBranchData = {
      id: branch.id,
      branch_name: branch.branch_name || '',
      address: branch.address || '',
      city: branch.city || '',
      contact_number: branch.contact_number || '9876543210',
    };
    this.showEditBranchModal = true;
  }

  async updateBranch() {
    try {
      await this.apiService.admin.updateBranch(this.editBranchData.id, {
        branch_name: this.editBranchData.branch_name,
        address: this.editBranchData.address,
        city: this.editBranchData.city,
        contact_number: this.editBranchData.contact_number,
      });
      alert('Branch details updated successfully!');
      this.showEditBranchModal = false;
      await this.fetchData();
    } catch (err: any) {
      alert(`Error updating branch: ${err.message}`);
    }
  }

  async deleteBranch(branch: any) {
    if (confirm(`Are you sure you want to delete branch "${branch.branch_name}"?`)) {
      try {
        await this.apiService.admin.deleteBranch(branch.id);
        alert('Branch deleted successfully!');
        await this.fetchData();
      } catch (err: any) {
        alert(`Error deleting branch: ${err.message}`);
      }
    }
  }

  addBranchForOwner(owner: any) {
    const prop = this.properties.find(p => p.owner_id === owner.id);
    if (!prop) {
      alert(`Owner "${owner.full_name}" does not have a property assigned yet.`);
      return;
    }
    this.branchData = {
      property_id: prop.id,
      branch_name: '',
      address: '',
      city: owner.city || 'Bengaluru',
      state: owner.state || 'Karnataka',
      contact_number: owner.contact_number || '',
    };
    this.showAddBranchModal = true;
  }

  async createBranch() {
    try {
      if (!this.branchData.property_id) {
        alert('Please select a Property first.');
        return;
      }
      await this.apiService.admin.createBranch(this.branchData);
      alert('Branch created successfully!');
      this.showAddBranchModal = false;
      this.fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }
}
