import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pharmacy {
  name: string;
  address: string;
  phone: string;
  hours: string;
  open24Hours: boolean;
  latitude?: number;
  longitude?: number;
}

export interface DashboardStats {
  totalMedicines: number;
  lowStockCount: number;
  pendingPrescriptions: number;
  fulfilledToday: number;
}

export interface PharmacistProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profilePhoto: string;
  licenseNumber: string;
  status: string;
  createdAt: string;
  pharmacy?: Pharmacy;
}


@Injectable({
  providedIn: 'root'
})
export class PharmacistService {

  private apiUrl = `${environment.apiUrl}/pharmacists`;

  constructor(private http: HttpClient) { }

  /** Get current pharmacist profile */
  getProfile(): Observable<PharmacistProfile> {
    // Attempting to get the current logged in user ID from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Fallback to /profile if ID is not available, but user mentioned /api/pharmacists/18
    // So we'll try to use the specific endpoint if possible, or just /profile if that's what the backend expects
    if (user?.id) {
      return this.getProfileById(user.id);
    }
    return this.http.get<PharmacistProfile>(`${this.apiUrl}/profile`).pipe(catchError(this.handleError));
  }

  /** Get profile by ID */
  getProfileById(id: number): Observable<PharmacistProfile> {
    return this.http.get<PharmacistProfile>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  /** Get dashboard stats */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`).pipe(catchError(this.handleError));
  }


  /** Build profile photo URL */
  getProfilePhotoUrl(filename: string | null | undefined): string {
    if (!filename) return '/assets/default-avatar.png';
    // If it's already a full URL or base64, return it
    if (filename.startsWith('http') || filename.startsWith('data:')) return filename;

    // Extract filename if it's a full path
    const cleanFilename = filename.includes('/') ? filename.split('/').pop() : filename;

    // Add timestamp for cache busting
    return `${this.apiUrl}/profile/photo/${cleanFilename}?t=${Date.now()}`;
  }

  /** Helper for errors */
  private handleError(error: any) {
    console.error('PharmacistService Error:', error);
    return throwError(() => new Error(error.error?.message || error.message || 'Server error'));
  }

  /** Update personal profile data (PUT /api/pharmacists/profile) */
  updateProfile(data: { firstName: string; lastName: string; phone: string; address: string }): Observable<PharmacistProfile> {
    return this.http.put<PharmacistProfile>(`${this.apiUrl}/profile`, data)
      .pipe(catchError(this.handleError));
  }

  /** Update pharmacy data (PUT /api/pharmacists/pharmacy) */
  updatePharmacy(data: { name: string; phone: string; address: string; hours: string; open24Hours: boolean }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pharmacy`, data)
      .pipe(catchError(this.handleError));
  }

  uploadPhoto(file: File): Observable<{ filename: string }> {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const formData = new FormData();
    formData.append('id', user?.id?.toString());
    formData.append('role', 'PHARMACIST');
    formData.append('file', file);
    // Note: this endpoint seems to be in a different controller based on previous turns
    return this.http.post<{ filename: string }>(`${environment.apiUrl}/profiles/photo`, formData)
      .pipe(catchError(this.handleError));
  }

  getPharmacy(): Observable<Pharmacy> {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return this.http.get<Pharmacy>(`${environment.apiUrl}/pharmacies/pharmacist/${user?.id}`)
      .pipe(catchError(this.handleError));
  }
}
