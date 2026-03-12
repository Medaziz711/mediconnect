import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PendingRequest {
  userId: number;
  fullName: string;
  email: string;
  role: 'DOCTOR' | 'PHARMACIST';
  licenseNumber: string;
  specialization?: string;      // for doctors
  pharmacyName?: string;        // for pharmacists
  submissionDate: string;       // ISO date string
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPendingRequests(): Observable<PendingRequest[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/demandes`).pipe(
      map((demandes: any[]) => demandes.map((d: any) => {
        // Robust role normalization
        let normalizedRole: 'DOCTOR' | 'PHARMACIST' = 'DOCTOR';
        const rawRole = (d.roleDemande || '').toUpperCase();
        if (rawRole.includes('PHARMAC')) {
          normalizedRole = 'PHARMACIST';
        } else if (rawRole.includes('DOCTOR') || rawRole.includes('MEDECIN')) {
          normalizedRole = 'DOCTOR';
        }

        return {
          userId: d.id,
          fullName: d.userName || (d.nom && d.prenom ? `${d.nom} ${d.prenom}` : 'Utilisateur'),
          email: d.userEmail || d.email,
          role: normalizedRole,
          licenseNumber: d.numeroOrdre || 'N/A',
          specialization: d.specialite,
          pharmacyName: d.pharmacyName,
          submissionDate: d.dateDemande
        };
      })),
      catchError(this.handleError)
    );
  }

  approveUser(id: number): Observable<any> {
    // Note: The backend expects adminUserId, defaulting to 1 or getting from auth
    const adminUserId = 1; 
    return this.http.post(`${this.baseUrl}/admin/demandes/${id}/accept`, { adminUserId }, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  rejectUser(id: number, reason: string): Observable<any> {
    const adminUserId = 1;
    return this.http.post(`${this.baseUrl}/admin/demandes/${id}/reject`, { 
      adminUserId, 
      motifRejet: reason 
    }, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let message = 'An unexpected error occurred';
    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else {
      message = error.error?.message || error.message || message;
    }
    return throwError(() => new Error(message));
  }
}
