import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Prescription {
  id: number;
  patientName: string;
  doctorName: string;
  date: string;
  medicinesSummary: string;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED';
  medicines: any[];
  instructions?: string;
  fulfilledDate?: string;
}

export interface FulfillRequest {
  verificationNotes: string;
  markAsPartiallyFulfilled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getPharmacyId(): number {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.id || 0;
  }

  getPendingPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/prescriptions/pending`)
      .pipe(catchError(this.handleError));
  }

  getFulfilledPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/prescriptions/fulfilled`)
      .pipe(catchError(this.handleError));
  }

  getPrescription(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.baseUrl}/prescriptions/${id}`)
      .pipe(catchError(this.handleError));
  }

  fulfillPrescription(id: number, data: FulfillRequest): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/prescriptions/${id}/fulfill`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    let message = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else {
      message = error.error?.message || error.message || 'Server error';
    }
    return throwError(() => new Error(message));
  }
}
