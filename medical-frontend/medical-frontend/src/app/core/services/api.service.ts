import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACIST';
  dateOfBirth?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  specialization?: string;
  numeroOrdre?: string;
  matricule?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  latitude?: number;
  longitude?: number;
  open24Hours?: boolean;
}

export interface GoogleLoginRequest {
  email: string;
  name: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN';
  idToken: string;
}

export interface DoctorResponse extends UserResponse {
  specialite?: string;
  numeroOrdre?: string;
  rating?: number;
  totalReviews?: number;
  specialization?: string;
  licenseNumber?: string;
  experienceYears?: number;
  consultationFee?: number;
  languagesSpoken?: string;
}

export interface PharmacistResponse extends UserResponse {
  pharmacyName?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export interface UserResponse {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  statut?: string;
  enabled?: boolean;
  createdAt?: string;
  profilePhoto?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
}

export interface AuthResponse {
  message: string;
  user: UserResponse;
  token: string | null;
}

export interface DemandeInscription {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  numeroOrdre?: string;
  specialite?: string;
  pharmacyName?: string;
  latitude?: number;
  longitude?: number;
  roleDemande: string;
  dateDemande: string;
  statut: string;
  motifRejet?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('ADM_DIAG: ApiService Version 10 - Loaded with responseType:text fixes');
  }

  // Authentication
  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('API - Login request to:', `${this.baseUrl}/auth/login`);
    console.log('API - Login credentials:', credentials);
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        catchError((error) => {
          console.error('API - Login error:', error);
          return this.handleError(error);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users`, data)
      .pipe(catchError(this.handleError));
  }

  registerPharmacist(data: RegisterRequest): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/users/auth/register/pharmacist`, data)
      .pipe(catchError(this.handleError));
  }

  loginWithGoogle(data: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users/login/google`, data)
      .pipe(catchError(this.handleError));
  }

  initiateGoogleRegistration(idToken: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/users/google/register-init`, { idToken })
      .pipe(catchError(this.handleError));
  }

  finalizeGoogleRegistration(idToken: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users/google/register-finalize`, { idToken, code })
      .pipe(catchError(this.handleError));
  }

  sendOTP(email: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/users/send-otp`, { email })
      .pipe(catchError(this.handleError));
  }

  verifyOTP(email: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users/verify-otp`, { email, code })
      .pipe(catchError(this.handleError));
  }

  verifyRegistration(email: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users/verify-registration`, { email, code })
      .pipe(catchError(this.handleError));
  }

  getUserByEmail(email: string): Observable<UserResponse> {
    return this.http
      .get<UserResponse>(`${this.baseUrl}/users/email/${encodeURIComponent(email)}`, {
        responseType: 'json',
      })
      .pipe(catchError(this.handleError));
  }

  getUserById(id: number, role?: string): Observable<UserResponse> {
    const options = role ? { params: { role } } : {};
    return this.http
      .get<UserResponse>(`${this.baseUrl}/users/${id}`, options)
      .pipe(catchError(this.handleError));
  }

  // Admin
  getPendingDemandes(): Observable<DemandeInscription[]> {
    return this.http
      .get<DemandeInscription[]>(`${this.baseUrl}/admin/demandes`)
      .pipe(catchError(this.handleError));
  }

  acceptDemande(id: number, adminUserId: number = 1): Observable<string> {
    console.log('ADM_DIAG: acceptDemande API calling...', id);
    return this.http
      .post(`${this.baseUrl}/admin/demandes/${id}/accept`, { adminUserId }, { responseType: 'text' })
      .pipe(
        catchError((err) => {
          if (err.status === 200) {
            console.warn('ADM_DIAG: acceptDemande caught a 200 OK as error. Returning body as success.');
            return [err.error || 'Success (Handled 200)'];
          }
          return this.handleError(err);
        })
      );
  }

  rejectDemande(id: number, adminUserId: number = 1, motifRejet?: string): Observable<string> {
    console.log('ADM_DIAG: rejectDemande API calling...', id);
    return this.http
      .post(`${this.baseUrl}/admin/demandes/${id}/reject`, {
        adminUserId,
        motifRejet: motifRejet || 'No reason provided',
      }, { responseType: 'text' })
      .pipe(
        catchError((err) => {
          if (err.status === 200) return [err.error || 'Success (Handled 200)'];
          return this.handleError(err);
        })
      );
  }

  getAllUsers(): Observable<UserResponse[]> {
    return this.http
      .get<UserResponse[]>(`${this.baseUrl}/admin/users`)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number, role: string): Observable<string> {
    return this.http
      .delete(`${this.baseUrl}/admin/users/${role}/${id}`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  // Appointments
  createAppointment(data: {
    doctorId: number;
    dateTime: string;
    duration: number;
    reason?: string;
  }): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/appointments`, data)
      .pipe(catchError(this.handleError));
  }

  getAppointmentsByPatient(patientId: number): Observable<unknown[]> {
    return this.http
      .get<unknown[]>(`${this.baseUrl}/appointments/patient/${patientId}`)
      .pipe(catchError(this.handleError));
  }

  getAppointmentsByDoctor(doctorId: number): Observable<unknown[]> {
    return this.http
      .get<unknown[]>(`${this.baseUrl}/appointments/doctor/${doctorId}`)
      .pipe(catchError(this.handleError));
  }

  confirmAppointment(id: number): Observable<unknown> {
    return this.http
      .put(`${this.baseUrl}/appointments/${id}/confirm`, {})
      .pipe(catchError(this.handleError));
  }

  cancelAppointment(id: number): Observable<unknown> {
    return this.http
      .put(`${this.baseUrl}/appointments/${id}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

  // Consultations
  createConsultation(data: {
    appointmentId: number;
    symptoms?: string;
    diagnosis?: string;
    recommendations?: string;
  }): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/consultations`, data)
      .pipe(catchError(this.handleError));
  }

  getConsultationsByPatient(patientId: number): Observable<unknown[]> {
    return this.http
      .get<unknown[]>(`${this.baseUrl}/consultations/patient/${patientId}`)
      .pipe(catchError(this.handleError));
  }

  getConsultationsByDoctor(doctorId: number): Observable<unknown[]> {
    return this.http
      .get<unknown[]>(`${this.baseUrl}/consultations/doctor/${doctorId}`)
      .pipe(catchError(this.handleError));
  }

  // Chatbot
  checkMedicine(data: {
    medicine: string;
    userLatitude: number;
    userLongitude: number;
  }): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/chatbot/check-medicine`, data)
      .pipe(catchError(this.handleError));
  }

  // Doctors
  getDoctors(): Observable<DoctorResponse[]> {
    return this.http
      .get<DoctorResponse[]>(`${this.baseUrl}/admin/users`)
      .pipe(
        map(users => users.filter(u => u.role === 'DOCTOR' && u.statut?.toLowerCase() === 'actif')),
        catchError(this.handleError)
      );
  }

  getDoctorById(id: number): Observable<DoctorResponse> {
    return this.http
      .get<DoctorResponse>(`${this.baseUrl}/doctors/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateDoctorProfile(id: number, data: any): Observable<DoctorResponse> {
    return this.http
      .put<DoctorResponse>(`${this.baseUrl}/doctors/profile/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  uploadDoctorPhoto(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('role', 'DOCTOR');
    formData.append('file', file);
    return this.http
      .post(`${this.baseUrl}/profiles/photo`, formData)
      .pipe(catchError(this.handleError));
  }

  rateDoctor(doctorId: number, rating: number, comment?: string): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/doctors/${doctorId}/rate`, { rating, comment })
      .pipe(catchError(this.handleError));
  }

  // Pharmacies
  getPharmacies(latitude?: number, longitude?: number, radius?: number): Observable<PharmacistResponse[]> {
    let url = `${this.baseUrl}/pharmacies`;
    const params: any = {};
    if (latitude !== undefined) params.latitude = latitude.toString();
    if (longitude !== undefined) params.longitude = longitude.toString();
    if (radius !== undefined) params.radius = radius.toString();

    return this.http
      .get<PharmacistResponse[]>(url, { params })
      .pipe(catchError(this.handleError));
  }

  getPharmacyById(id: number): Observable<PharmacistResponse> {
    return this.http
      .get<PharmacistResponse>(`${this.baseUrl}/pharmacies/${id}`)
      .pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/users/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/users/reset-password`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    let message = 'An unexpected error occurred';

    if (error?.error) {
      const err = error.error;

      if (typeof err === 'string') {
        // Plain text error body
        message = err;
      } else if (typeof err === 'object') {
        if (err.errors && typeof err.errors === 'object') {
          // Structured validation error: { message, errors: { field: msg } }
          const fieldMessages = Object.entries(err.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(' | ');
          message = fieldMessages || err.message || 'Validation failed';
        } else if (err.message) {
          // Simple { message: '...' } response
          message = err.message;
        } else if (err.error) {
          // Wrapped { error: '...' } response
          message = err.error;
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    const errObj = new Error(message);
    (errObj as any).status = error.status;
    return throwError(() => errObj);
  }
}
