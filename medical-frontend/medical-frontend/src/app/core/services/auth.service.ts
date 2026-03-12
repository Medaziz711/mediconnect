import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.apiUrl;

    login(credentials: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
            .pipe(
                tap(response => {
                    this.handleAuthSuccess(response);
                }),
                catchError(error => throwError(() => error))
            );
    }

    private handleError(error: any) {
        let message = 'Une erreur est survenue';
        if (error.status === 401) {
            message = 'Email ou mot de passe incorrect';
        } else if (error.status === 404) {
            message = 'Compte non trouvé pour ce rôle';
        } else if (error.error?.message) {
            message = error.error.message;
        } else if (error.message) {
            message = error.message;
        }
        return throwError(() => new Error(message));
    }

    handleAuthSuccess(response: AuthResponse) {
        if (response.token) {
            localStorage.setItem('token', response.token);
        }
        localStorage.setItem('user', JSON.stringify(response.user));

        // Redirect based on role
        this.redirectUserByRole(response.user.role);
    }

    redirectUserByRole(role: string) {
        const upperRole = (role || '').toUpperCase();
        console.log('AuthService: Redirecting user with role:', upperRole);

        if (upperRole.includes('ADMIN')) {
            this.router.navigate(['/admin']);
        } else if (upperRole === 'PATIENT') {
            this.router.navigate(['/patient']);
        } else if (upperRole === 'DOCTOR') {
            this.router.navigate(['/doctor']);
        } else if (upperRole === 'PHARMACIST') {
            // Direct navigation to the dashboard
            this.router.navigate(['/pharmacist/dashboard']);
        } else {
            this.router.navigate(['/home']);
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/auth']);
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}
