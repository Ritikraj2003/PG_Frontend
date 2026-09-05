import { AuthService } from '../../../services/auth.service';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-owner-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-rooms.component.html',
  styleUrl: './owner-rooms.component.css',
})
export class OwnerRoomsComponent {
  public authService = inject(AuthService);

  private apiService = inject(ApiService);

  @Input() rooms: any[] = [];
  @Input() branchId: string = '';
  @Input() showModal: boolean = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() showModalChange = new EventEmitter<boolean>();
  @Output() refreshRooms = new EventEmitter<void>();

  openAddRoomModal() {
    this.showModal = true;
    this.showModalChange.emit(true);
  }

  handleCloseModal() {
    this.showModal = false;
    this.showModalChange.emit(false);
    this.closeModal.emit();
  }

  searchQuery: string = '';
  statusFilter: string = 'ALL';
  typeFilter: string = 'ALL';
  floorFilter: string = 'ALL';

  get filteredRooms(): any[] {
    return (this.rooms || []).filter(room => {
      // Search by room number or room type
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const num = (room.room_number || '').toString().toLowerCase();
        const type = (room.room_type || '').toLowerCase();
        if (!num.includes(q) && !type.includes(q)) {
          return false;
        }
      }
      // Status Filter
      if (this.statusFilter !== 'ALL') {
        const s = room.status || 'AVAILABLE';
        if (this.statusFilter === 'AVAILABLE' && s !== 'AVAILABLE') return false;
        if (this.statusFilter === 'PARTIALLY_OCCUPIED' && s !== 'PARTIALLY_OCCUPIED') return false;
        if (this.statusFilter === 'FULLY_OCCUPIED' && s !== 'FULLY_OCCUPIED') return false;
      }
      // Sharing Type Filter
      if (this.typeFilter !== 'ALL' && room.room_type !== this.typeFilter) {
        return false;
      }
      // Floor Filter
      if (this.floorFilter !== 'ALL' && (room.floor_number ?? 1).toString() !== this.floorFilter) {
        return false;
      }
      return true;
    });
  }

  get totalBedsCount(): number {
    return (this.rooms || []).reduce((acc, r) => acc + Number(r.total_beds || r.capacity || 2), 0);
  }

  get availableBedsCount(): number {
    return (this.rooms || []).reduce((acc, r) => {
      const avail = r.available_beds !== undefined ? Number(r.available_beds) : Number(r.total_beds || r.capacity || 2);
      return acc + Math.max(0, avail);
    }, 0);
  }

  get occupiedBedsCount(): number {
    return Math.max(0, this.totalBedsCount - this.availableBedsCount);
  }

  get occupancyRate(): number {
    if (this.totalBedsCount === 0) return 0;
    return Math.min(100, Math.round((this.occupiedBedsCount / this.totalBedsCount) * 100));
  }

  get availableFloors(): number[] {
    const floors = new Set<number>();
    (this.rooms || []).forEach(r => {
      if (r.floor_number !== undefined && r.floor_number !== null) {
        floors.add(Number(r.floor_number));
      }
    });
    return Array.from(floors).sort((a, b) => a - b);
  }

  getOccupancyText(room: any): string {
    const total = Number(room.total_beds || room.capacity || 2);
    const avail = Number(room.available_beds !== undefined ? room.available_beds : total);
    if (avail >= total) return '100% Vacant';
    if (avail <= 0) return '100% Full';
    const occ = total - avail;
    return `${Math.round((occ / total) * 100)}% Occupied`;
  }

  getOccupiedPercentage(room: any): number {
    const total = Number(room.total_beds || room.capacity || 2);
    if (total === 0) return 0;
    const avail = Number(room.available_beds !== undefined ? room.available_beds : total);
    const occ = Math.max(0, total - avail);
    return Math.min(100, Math.round((occ / total) * 100));
  }

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.typeFilter = 'ALL';
    this.floorFilter = 'ALL';
  }

  roomTypes = ['Single', 'Double Sharing', 'Triple Sharing', 'Dormitory', 'Studio'];

  roomForm = {
    room_number: '',
    floor_number: 1,
    room_type: 'Double Sharing',
    capacity: 2,
    monthly_rent: 8500,
    security_deposit: 15000,
  };

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isUploading = false;

  selectedRoomForBeds: any = null;
  showBedManager = false;
  roomBeds: any[] = [];

  previewRoom: any = null;

  isAddingBed = false;
  newBedForm = {
    bed_number: '',
    monthly_rent: 8500,
    security_deposit: 15000,
  };

  editingBedId: string | null = null;
  editBedForm = {
    bed_number: '',
    monthly_rent: 8500,
    security_deposit: 15000,
    status: 'AVAILABLE',
  };
  isSavingBed = false;

  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
    event.target.value = '';
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  async submitCreateRoom() {
    if (!this.roomForm.room_number) {
      alert('Please enter a Room Number (e.g. 101)');
      return;
    }
    if (!this.branchId) {
      alert('Please select a Branch first');
      return;
    }

    try {
      this.isUploading = true;

      const formData = new FormData();
      formData.append('branch_id', this.branchId);
      formData.append('room_number', this.roomForm.room_number);
      formData.append('floor_number', this.roomForm.floor_number.toString());
      formData.append('room_type', this.roomForm.room_type);
      formData.append('capacity', this.roomForm.capacity.toString());
      formData.append('monthly_rent', this.roomForm.monthly_rent.toString());
      formData.append('security_deposit', this.roomForm.security_deposit.toString());

      if (this.selectedFiles && this.selectedFiles.length > 0) {
        for (const file of this.selectedFiles) {
          formData.append('images', file);
        }
      }

      await this.apiService.owner.createRoom(formData);
      alert('🎉 Room added successfully!');

      this.resetForm();
      this.handleCloseModal();
      this.refreshRooms.emit();
    } catch (err: any) {
      alert(`Error creating room: ${err.message || 'Server error'}`);
    } finally {
      this.isUploading = false;
    }
  }

  async openBedManager(room: any) {
    this.selectedRoomForBeds = room;
    this.showBedManager = true;
    this.editingBedId = null;
    this.newBedForm = {
      bed_number: `Bed ${(room.beds?.length || 0) + 1}`,
      monthly_rent: room.monthly_rent || 8500,
      security_deposit: room.security_deposit || 15000,
    };
    await this.loadRoomBeds(room.id);
  }

  async loadRoomBeds(roomId: string) {
    try {
      const beds = await this.apiService.owner.getBeds(roomId);
      this.roomBeds = beds || [];
      if (this.selectedRoomForBeds) {
        this.selectedRoomForBeds.beds = this.roomBeds;
      }
    } catch (err) {
      console.error('Failed to load beds for room:', err);
    }
  }

  closeBedManager() {
    this.showBedManager = false;
    this.selectedRoomForBeds = null;
    this.roomBeds = [];
    this.editingBedId = null;
  }

  async addBedToRoom() {
    if (!this.selectedRoomForBeds || !this.branchId) return;
    if (!this.newBedForm.bed_number) {
      alert('Please enter Bed Identifier (e.g. Bed 3)');
      return;
    }

    try {
      this.isAddingBed = true;
      await this.apiService.owner.createBed({
        branch_id: this.branchId,
        room_id: this.selectedRoomForBeds.id,
        bed_number: this.newBedForm.bed_number,
        monthly_rent: this.newBedForm.monthly_rent,
        security_deposit: this.newBedForm.security_deposit,
      });

      alert(`✅ ${this.newBedForm.bed_number} added successfully to Room ${this.selectedRoomForBeds.room_number}!`);
      await this.loadRoomBeds(this.selectedRoomForBeds.id);
      this.refreshRooms.emit();

      this.newBedForm.bed_number = `Bed ${this.roomBeds.length + 1}`;
    } catch (err: any) {
      alert(`Error adding bed: ${err.message}`);
    } finally {
      this.isAddingBed = false;
    }
  }

  editBed(bed: any) {
    this.editingBedId = bed.id;
    this.editBedForm = {
      bed_number: bed.bed_number,
      monthly_rent: bed.monthly_rent || 8500,
      security_deposit: bed.security_deposit || 15000,
      status: bed.status || 'AVAILABLE',
    };
  }

  cancelEditBed() {
    this.editingBedId = null;
  }

  async saveEditBed() {
    if (!this.editingBedId) return;
    try {
      this.isSavingBed = true;
      await this.apiService.owner.updateBed(this.editingBedId, this.editBedForm);
      alert('✅ Bed updated successfully!');
      this.editingBedId = null;
      if (this.selectedRoomForBeds) {
        await this.loadRoomBeds(this.selectedRoomForBeds.id);
      }
      this.refreshRooms.emit();
    } catch (err: any) {
      alert(`Error updating bed: ${err.message}`);
    } finally {
      this.isSavingBed = false;
    }
  }

  async deleteBed(bed: any) {
    if (!confirm(`Are you sure you want to delete ${bed.bed_number} from Room ${this.selectedRoomForBeds?.room_number}?`)) return;
    try {
      await this.apiService.owner.deleteBed(bed.id);
      alert(`🗑️ ${bed.bed_number} deleted successfully.`);
      if (this.selectedRoomForBeds) {
        await this.loadRoomBeds(this.selectedRoomForBeds.id);
      }
      this.refreshRooms.emit();
    } catch (err: any) {
      alert(`Error deleting bed: ${err.message}`);
    }
  }

  resetForm() {
    this.roomForm = {
      room_number: '',
      floor_number: 1,
      room_type: 'Double Sharing',
      capacity: 2,
      monthly_rent: 8500,
      security_deposit: 15000,
    };
    this.selectedFiles = [];
    this.imagePreviews = [];
  }

  openPreview(room: any) {
    this.previewRoom = room;
  }

  closePreview() {
    this.previewRoom = null;
  }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${cleanPath}`;
  }
}
