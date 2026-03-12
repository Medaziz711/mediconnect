import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MedicineStock {
  id: number;
  name: string;
  manufacturer: string;
  quantity: number;
  price: number;
  expiryDate: string;
  dosage: string;
  form: string;
  description?: string;
  requiresPrescription: boolean;
  status?: 'NORMAL' | 'LOW_STOCK' | 'EXPIRING_SOON';
}

export interface AddMedicineRequest {
  name: string;
  manufacturer: string;
  quantity: number;
  price: number;
  expiryDate: string;
  dosage: string;
  form: string;
  description?: string;
  requiresPrescription: boolean;
}

export interface UpdateStockRequest {
  quantity: number;
  price: number;
  expiryDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getPharmacyId(): number {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.id || 0; // In this app, pharmacist ID is often synonymous with pharmacy ID or used to fetch it
  }

  getStock(): Observable<MedicineStock[]> {
    return this.http.get<MedicineStock[]>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/stock`)
      .pipe(catchError(this.handleError));
  }

  getLowStock(threshold?: number): Observable<MedicineStock[]> {
    let params = new HttpParams();
    if (threshold) params = params.set('threshold', threshold.toString());
    return this.http.get<MedicineStock[]>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/stock/low`, { params })
      .pipe(catchError(this.handleError));
  }

  getExpiringMedicines(days?: number): Observable<MedicineStock[]> {
    let params = new HttpParams();
    if (days) params = params.set('days', days.toString());
    return this.http.get<MedicineStock[]>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/stock/expiring`, { params })
      .pipe(catchError(this.handleError));
  }

  addMedicine(data: AddMedicineRequest): Observable<MedicineStock> {
    return this.http.post<MedicineStock>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/stock`, data)
      .pipe(catchError(this.handleError));
  }

  updateStock(id: number, data: UpdateStockRequest): Observable<MedicineStock> {
    return this.http.put<MedicineStock>(`${this.baseUrl}/stock/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteMedicine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/stock/${id}`)
      .pipe(catchError(this.handleError));
  }

  searchMedicines(query: string): Observable<MedicineStock[]> {
    let params = new HttpParams().set('query', query);
    return this.http.get<MedicineStock[]>(`${this.baseUrl}/pharmacies/${this.getPharmacyId()}/stock/search`, { params })
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
