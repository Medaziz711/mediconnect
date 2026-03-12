import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PharmacistService, PharmacistProfile } from '../../../core/services/pharmacist.service';

@Component({
  selector: 'app-pharmacist-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pharmacist-profile.component.html',
  styleUrls: ['./pharmacist-profile.component.css']
})
export class PharmacistProfileComponent implements OnInit {

  pharmacist = signal<PharmacistProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  activeEditTab = signal<'personal' | 'pharmacy'>('personal');

  // For the edit modal (optional but keeping it for future use)
  showEditModal = signal(false);
  isSaving = signal(false);
  editForm!: FormGroup;
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  constructor(private pharmacistService: PharmacistService, private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  initForm() {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      address: [''],
      pharmacyName: ['', Validators.required],
      pharmacyPhone: [''],
      pharmacyAddress: ['', Validators.required],
      hours: [''],
      open24Hours: [false]
    });
  }

  loadProfile(): void {
    this.loading.set(true);
    this.pharmacistService.getProfile().subscribe({
      next: (data) => {
        console.log('Profile data received:', data);
        this.pharmacist.set(data);
        this.patchForm(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error.set('Impossible de charger le profil');
        this.loading.set(false);
      }
    });
  }

  patchForm(data: PharmacistProfile) {
    this.editForm.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      pharmacyName: data.pharmacy?.name,
      pharmacyPhone: data.pharmacy?.phone,
      pharmacyAddress: data.pharmacy?.address,
      hours: data.pharmacy?.hours,
      open24Hours: data.pharmacy?.open24Hours
    });
  }

  get profilePhotoUrl(): string {
    return this.pharmacistService.getProfilePhotoUrl(this.pharmacist()?.profilePhoto);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/default-avatar.png';
  }

  // Edit methods
  openEditModal() {
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewUrl.set(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto() {
    const file = this.selectedFile();
    if (file) {
      this.pharmacistService.uploadPhoto(file).subscribe({
        next: (res) => {
          this.loadProfile();
          this.selectedFile.set(null);
          this.previewUrl.set(null);
          alert('Photo mise à jour');
        },
        error: (err) => alert(err.message)
      });
    }
  }

  // Save profile and pharmacy data
  saveProfile() {
    if (this.editForm.invalid) return;
    this.isSaving.set(true);

    const formValue = this.editForm.value;

    if (this.activeEditTab() === 'personal') {
      const personalData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        address: formValue.address
      };
      this.pharmacistService.updateProfile(personalData).subscribe({
        next: () => {
          this.loadProfile();
          this.isSaving.set(false);
          this.closeEditModal();
          alert('Profil mis à jour avec succès !');
        },
        error: (err) => {
          this.isSaving.set(false);
          alert('Erreur lors de la mise à jour : ' + err.message);
        }
      });
    } else {
      const pharmacyData = {
        name: formValue.pharmacyName,
        phone: formValue.pharmacyPhone,
        address: formValue.pharmacyAddress,
        hours: formValue.hours,
        open24Hours: formValue.open24Hours
      };
      this.pharmacistService.updatePharmacy(pharmacyData).subscribe({
        next: () => {
          this.loadProfile();
          this.isSaving.set(false);
          this.closeEditModal();
          alert('Pharmacie mise à jour avec succès !');
        },
        error: (err) => {
          this.isSaving.set(false);
          alert('Erreur lors de la mise à jour : ' + err.message);
        }
      });
    }
  }
}
