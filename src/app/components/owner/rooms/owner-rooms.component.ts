import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
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
export class OwnerRoomsComponent implements OnInit, OnChanges {
  private apiService = inject(ApiService);

  @Input() rooms: any[] = [];
  @Input() branchId: string = '';
  @Input() showModal: boolean = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() refreshRooms = new EventEmitter<void>();

  floors: any[] = [];
  roomTypes: any[] = [];

  // Form Model
  roomForm = {
    room_number: '',
    room_name: '',
    floor_id: '',
    room_type_id: '',
    capacity: 2,
    monthly_rent: 8500,
    security_deposit: 15000,
    electricity_charge: 0,
    maintenance_charge: 0,
    description: '',
  };

  // Image Upload State
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isUploading = false;

  // Photo Gallery Modal state
  previewRoom: any = null;

  // Bed Management Modal state
  showBedManager = false;
  selectedRoomForBeds: any = null;
  roomBeds: any[] = [];
  isAddingBed = false;
  newBedForm = {
    bed_number: '',
    monthly_rent: 8500,
    security_deposit: 15000,
  };

  // Floor Management Modal State
  showFloorManager = false;
  editingFloorId: string | null = null;
  floorForm = {
    floor_number: 1,
    floor_name: '',
    description: '',
  };
  isSavingFloor = false;

  ngOnInit() {
    if (this.branchId) {
      this.loadMasterData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['branchId'] && this.branchId) || changes['showModal']?.currentValue === true) {
      this.loadMasterData();
    }
  }

  async loadMasterData() {
    if (!this.branchId) return;
    try {
      const [floorsRes, typesRes] = await Promise.all([
        this.apiService.owner.getFloors(this.branchId).catch(() => []),
        this.apiService.owner.getRoomTypes().catch(() => []),
      ]);
      this.floors = floorsRes || [];
      this.roomTypes = typesRes || [];

      if (this.floors.length > 0 && (!this.roomForm.floor_id || !this.floors.some(f => f.id === this.roomForm.floor_id))) {
        this.roomForm.floor_id = this.floors[0].id;
      }
      if (this.roomTypes.length > 0 && !this.roomForm.room_type_id) {
        this.roomForm.room_type_id = this.roomTypes[0].id;
      }
    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  }

  // --- Floor Management CRUD ---
  openFloorManager() {
    this.showFloorManager = true;
    this.resetFloorForm();
  }

  closeFloorManager() {
    this.showFloorManager = false;
    this.editingFloorId = null;
    this.resetFloorForm();
  }

  resetFloorForm() {
    const nextNum = (this.floors?.length || 0);
    this.floorForm = {
      floor_number: nextNum,
      floor_name: nextNum === 0 ? 'Ground Floor' : `${nextNum}${this.getOrdinalSuffix(nextNum)} Floor`,
      description: '',
    };
    this.editingFloorId = null;
  }

  getOrdinalSuffix(i: number) {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  editFloor(floor: any) {
    this.editingFloorId = floor.id;
    this.floorForm = {
      floor_number: floor.floor_number,
      floor_name: floor.floor_name,
      description: floor.description || '',
    };
  }

  async saveFloor() {
    if (!this.floorForm.floor_name) {
      alert('Please enter Floor Name (e.g. 1st Floor)');
      return;
    }
    if (!this.branchId) {
      alert('Please select a branch first');
      return;
    }

    try {
      this.isSavingFloor = true;
      if (this.editingFloorId) {
        await this.apiService.owner.updateFloor(this.editingFloorId, this.floorForm);
      } else {
        await this.apiService.owner.createFloor({
          branch_id: this.branchId,
          ...this.floorForm,
        });
      }
      await this.loadMasterData();
      this.resetFloorForm();
    } catch (err: any) {
      alert(`Error saving floor: ${err.message}`);
    } finally {
      this.isSavingFloor = false;
    }
  }

  async deleteFloor(floor: any) {
    if (!confirm(`Are you sure you want to delete "${floor.floor_name}"?`)) return;
    try {
      await this.apiService.owner.deleteFloor(floor.id);
      await this.loadMasterData();
      if (this.roomForm.floor_id === floor.id) {
        this.roomForm.floor_id = this.floors[0]?.id || '';
      }
    } catch (err: any) {
      alert(`Error deleting floor: ${err.message}`);
    }
  }

  // --- Room Operations & Files ---
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
      if (this.roomForm.room_name) formData.append('room_name', this.roomForm.room_name);
      if (this.roomForm.floor_id) formData.append('floor_id', this.roomForm.floor_id);
      if (this.roomForm.room_type_id) formData.append('room_type_id', this.roomForm.room_type_id);
      formData.append('capacity', (this.roomForm.capacity || 1).toString());
      formData.append('monthly_rent', (this.roomForm.monthly_rent || 0).toString());
      formData.append('security_deposit', (this.roomForm.security_deposit || 0).toString());
      formData.append('electricity_charge', (this.roomForm.electricity_charge || 0).toString());
      formData.append('maintenance_charge', (this.roomForm.maintenance_charge || 0).toString());
      if (this.roomForm.description) formData.append('description', this.roomForm.description);

      // Append image files directly to FormData
      if (this.selectedFiles && this.selectedFiles.length > 0) {
        for (const file of this.selectedFiles) {
          formData.append('images', file);
        }
      }

      await this.apiService.owner.createRoom(formData);
      alert('🎉 Room & Beds added successfully!');

      this.resetForm();
      this.closeModal.emit();
      this.refreshRooms.emit();
    } catch (err: any) {
      alert(`Error creating room: ${err.message || 'Server error'}`);
    } finally {
      this.isUploading = false;
    }
  }

  // --- Bed Management Modal ---
  editingBedId: string | null = null;
  editBedForm = {
    bed_number: '',
    bed_name: '',
    monthly_rent: 8500,
    security_deposit: 15000,
    status: 'AVAILABLE',
  };
  isSavingBed = false;

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
        bed_name: `${this.selectedRoomForBeds.room_number} - ${this.newBedForm.bed_number}`,
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
      bed_name: bed.bed_name || '',
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
      room_name: '',
      floor_id: this.floors[0]?.id || '',
      room_type_id: this.roomTypes[0]?.id || '',
      capacity: 2,
      monthly_rent: 8500,
      security_deposit: 15000,
      electricity_charge: 0,
      maintenance_charge: 0,
      description: '',
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
