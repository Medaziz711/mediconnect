import { Component, signal, OnInit, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService, LoginRequest, RegisterRequest, AuthResponse } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

declare var google: any;

type AuthMode = 'login' | 'register' | 'otp' | 'otp-registration' | 'forgot-password' | 'reset-password';
type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN';
type AnimationState = 'TEXT_FORMING' | 'EXPLODING' | 'BACKGROUND_ACTIVE';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  density: number;
  color: string;
  angle: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GoogleMapsModule],
  template: `
    <div class="auth-container" [class.show-form]="animationState() === 'BACKGROUND_ACTIVE'">
      <canvas #bgCanvas id="bg-canvas"></canvas>
      
      <div class="auth-card" *ngIf="animationState() === 'BACKGROUND_ACTIVE'">
        <div class="auth-header">
          <h1>Medicoonect Pro</h1>
          <p class="subtitle">Trusted Professional Healthcare Connection</p>
        </div>

        <div class="mode-toggle">
          <button [class.active]="mode() === 'login'" (click)="setMode('login')" type="button">Connexion</button>
          <button [class.active]="mode() === 'register'" (click)="setMode('register')" type="button">Inscription</button>
        </div>

        <div class="form-scroll-container">
          <div [hidden]="mode() !== 'login'" class="form-container">
            <h3>Bienvenue</h3>
            <div class="role-selection">
              <label>Se connecter en tant que :</label>
              <div class="role-buttons">
                <button type="button" [class.active]="selectedRole() === 'PATIENT'" (click)="selectedRole.set('PATIENT')">Patient</button>
                <button type="button" [class.active]="selectedRole() === 'DOCTOR'" (click)="selectedRole.set('DOCTOR')">Médecin</button>
                <button type="button" [class.active]="selectedRole() === 'PHARMACIST'" (click)="selectedRole.set('PHARMACIST')">Pharmacien</button>
                <button type="button" [class.active]="selectedRole() === 'ADMIN'" (click)="selectedRole.set('ADMIN')" class="admin-btn">👑 Admin</button>
              </div>
            </div>

            <div class="google-only-container" [hidden]="selectedRole() !== 'PATIENT'">
              <p class="google-hint">La connexion pour les patients se fait exclusivement avec Google.</p>
              <div id="google-btn-login" class="google-btn-container"></div>
            </div>


            <form [formGroup]="loginForm" (ngSubmit)="onLogin()" *ngIf="selectedRole() !== 'PATIENT'">
              <div class="form-group">
                <label>{{ getLoginIdentifierLabel() }}</label>
                <input [type]="selectedRole() === 'DOCTOR' || selectedRole() === 'PHARMACIST' ? 'text' : 'email'"
                       formControlName="email" [placeholder]="getLoginIdentifierPlaceholder()"
                       [class.input-error]="getEmailError('login')" />
                @if (getEmailError('login')) {
                  <span class="error-msg">{{ getEmailError('login') }}</span>
                }
              </div>
              <div class="form-group">
                <label>Mot de passe</label>
                <div class="password-wrapper">
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="Votre mot de passe"
                         [class.input-error]="hasError('login', 'password')" />
                  <button type="button" class="password-toggle-btn" (click)="togglePassword()" tabindex="-1">
                    <i [class]="showPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                @if (hasError('login', 'password')) {
                  <span class="error-msg">Le mot de passe est requis (min 6 caractères)</span>
                }
              </div>
              
              <div class="forgot-password-link">
                <a (click)="setMode('forgot-password')">Mot de passe oublié ?</a>
              </div>

              <!-- Server Error Message specificly for Login -->
              @if (serverError()) {
                <div class="server-error-banner" @fadeInOut>
                  {{ serverError() }}
                </div>
              }

              <button type="submit" class="submit-btn" [disabled]="loading() || loginForm.invalid">
                <span *ngIf="loading()" class="spinner"></span>
                <span *ngIf="!loading()">Se connecter</span>
              </button>
            </form>
          </div>

          <!-- Forgot Password Mode -->
          <div [hidden]="mode() !== 'forgot-password'" class="form-container">
            <h3>Mot de passe oublié</h3>
            <p class="subtitle">Entrez votre email pour recevoir un lien de réinitialisation.</p>
            
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onForgotPassword()">
              <div class="form-group">
                <label>Email Gmail</label>
                <input type="email" formControlName="email" placeholder="votre@gmail.com"
                       [class.error]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched" />
              </div>
              
              <button type="submit" class="submit-btn" [disabled]="loading() || forgotPasswordForm.invalid">
                <span *ngIf="loading()" class="spinner"></span>
                <span *ngIf="!loading()">Envoyer le lien</span>
              </button>
              
              <button type="button" class="back-link" (click)="setMode('login')">
                Retour à la connexion
              </button>
            </form>
          </div>

          <!-- Reset Password Mode -->
          <div [hidden]="mode() !== 'reset-password'" class="form-container">
            <h3>Nouveau mot de passe</h3>
            <p class="subtitle">Définissez votre nouveau mot de passe sécurisé.</p>
            
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onResetPassword()">
              <div class="form-group">
                <label>Nouveau mot de passe</label>
                <div class="password-wrapper">
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="6-15 chars, incl. chiffre + (@ . - _ / % *)"
                         [class.input-error]="resetPasswordForm.get('password')?.invalid && resetPasswordForm.get('password')?.touched" />
                  <button type="button" class="password-toggle-btn" (click)="showPassword.set(!showPassword())" tabindex="-1">
                    <i [class]="showPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <small class="password-hint">6-15 caractères, au moins un chiffre, symboles : @ . - _ / % *</small>
                <span class="error-msg" *ngIf="resetPasswordForm.get('password')?.invalid && resetPasswordForm.get('password')?.touched">
                  Format invalide (6-15 chars, 1 chiffre, symboles autorisés).
                </span>
              </div>
              <div class="form-group">
                <label>Confirmer le mot de passe</label>
                <input type="password" formControlName="confirmPassword" placeholder="Répétez le mot de passe"
                       [class.input-error]="resetPasswordForm.errors?.['mismatch'] && resetPasswordForm.get('confirmPassword')?.touched" />
                <span class="error-msg" *ngIf="resetPasswordForm.errors?.['mismatch'] && resetPasswordForm.get('confirmPassword')?.touched">
                  Les mots de passe ne correspondent pas.
                </span>
              </div>
              
              <button type="submit" class="submit-btn" [disabled]="loading() || resetPasswordForm.invalid">
                <span *ngIf="loading()" class="spinner"></span>
                <span *ngIf="!loading()">Réinitialiser le mot de passe</span>
              </button>
            </form>
          </div>

          <div [hidden]="mode() !== 'otp'" class="form-container">
            <h3>Vérification</h3>
            <p class="verification-hint">Un code a été envoyé à <strong>{{ loginForm.get('email')?.value }}</strong></p>
            
            <div class="form-group">
              <label>Code de vérification (6 chiffres)</label>
              <input type="text" #otpInput placeholder="XXXXXX" maxlength="6" class="otp-input"
                     (input)="onOtpInput(otpInput.value)" />
            </div>
            
            <button type="button" class="submit-btn" [disabled]="loading() || otpInput.value.length < 6" (click)="onVerifyOtp(otpInput.value)">
              <span *ngIf="loading()" class="spinner"></span>
              <span *ngIf="!loading()">Vérifier et se connecter</span>
            </button>
            
            <button type="button" class="resend-btn" (click)="onLogin()" [disabled]="loading()">
              Renvoyer le code
            </button>
          </div>

          <div [hidden]="mode() !== 'otp-registration'" class="form-container">
            <h3>Vérification d'inscription</h3>
            <p class="verification-hint">Bienvenue ! Un code de vérification a été envoyé à votre adresse Gmail pour activer votre compte.</p>
            
            <div class="form-group">
              <label>Code de vérification (6 chiffres)</label>
              <input type="text" #otpRegInput placeholder="XXXXXX" maxlength="6" class="otp-input"
                     (input)="onOtpRegistrationInput(otpRegInput.value)" />
            </div>
            
            <button type="button" class="submit-btn" [disabled]="loading() || otpRegInput.value.length < 6" (click)="onVerifyRegistration(otpRegInput.value)">
              <span *ngIf="loading()" class="spinner"></span>
              <span *ngIf="!loading()">Vérifier et activer mon compte</span>
            </button>
          </div>

          <div [hidden]="mode() !== 'register'" class="form-container registration-form">
            <h3>Créer un compte</h3>
            <div class="role-selection">
              <label>Je suis un(e) :</label>
              <div class="role-buttons">
                <button type="button" [class.active]="selectedRole() === 'PATIENT'" (click)="selectedRole.set('PATIENT')">Patient</button>
                <button type="button" [class.active]="selectedRole() === 'DOCTOR'" (click)="selectedRole.set('DOCTOR')">Médecin</button>
                <button type="button" [class.active]="selectedRole() === 'PHARMACIST'" (click)="selectedRole.set('PHARMACIST')">Pharmacien</button>
              </div>
            </div>

            <div class="google-only-container" [hidden]="selectedRole() !== 'PATIENT'">
              <p class="google-hint">L'inscription pour les patients se fait exclusivement avec Google.</p>
              <div id="google-btn-register" class="google-btn-container"></div>
            </div>

            <form [formGroup]="registerForm" (ngSubmit)="onRegister()" *ngIf="selectedRole() !== 'PATIENT'">
              <div class="form-section">
                <h4 class="section-title">Informations</h4>
                <div class="form-group">
                  <input type="text" formControlName="name" placeholder="Nom complet" 
                         [class.input-error]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched" />
                  <span class="error-msg" *ngIf="registerForm.get('name')?.invalid && registerForm.get('name')?.touched">
                    Ce champ est requis (min 2 caractères)
                  </span>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <input type="email" formControlName="email" placeholder="Votre Adresse Gmail" 
                           [class.input-error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" />
                    <span class="error-msg" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                      Format Gmail invalide
                    </span>
                  </div>
                  <div class="form-group">
                    <div class="password-wrapper">
                      <input [type]="showRegisterPassword() ? 'text' : 'password'" formControlName="password" placeholder="Mot de passe"
                             [class.input-error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" />
                      <button type="button" class="password-toggle-btn" (click)="showRegisterPassword.set(!showRegisterPassword())" tabindex="-1">
                        <i [class]="showRegisterPassword() ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                    <small class="password-hint">6-15 caractères, au moins un chiffre, symboles : @ . - _ / % *</small>
                    <span class="error-msg" *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                      Format invalide (6-15 chars, 1 chiffre, symboles autorisés)
                    </span>
                  </div>
                </div>

                <!-- Doctor specific fields -->
                <div *ngIf="selectedRole() === 'DOCTOR'">
                  <div class="form-row">
                    <div class="form-group"><input type="text" formControlName="matricule" placeholder="Matricule / Numero d'ordre" /></div>
                    <div class="form-group">
                      <select formControlName="specialization" class="specialization-select">
                        <option value="" disabled selected>Spécialité</option>
                        <option value="Generaliste">Généraliste</option>
                        <option value="Cardiologie">Cardiologie</option>
                        <option value="Dermatologie">Dermatologie</option>
                        <option value="Pediatrie">Pédiatrie</option>
                        <option value="Gynecologie">Gynécologie</option>
                        <option value="Ophtalmologie">Ophtalmologie</option>
                        <option value="Neurologie">Neurologie</option>
                        <option value="Psychiatrie">Psychiatrie</option>
                        <option value="Dentiste">Dentiste</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Pharmacist specific fields -->
                <div *ngIf="selectedRole() === 'PHARMACIST'">
                  <div class="form-group"><input type="text" formControlName="matricule" placeholder="Matricule / Numero d'ordre" /></div>
                  <div class="pharmacy-section">
                    <h5 class="sub-section-title">Informations Pharmacie</h5>
                    <div class="form-group">
                      <label>Nom de la pharmacie *</label>
                      <input type="text" formControlName="pharmacyName" placeholder="Ex: Pharmacie du Centre" />
                    </div>
                    <div class="form-group">
                      <label>Adresse de la pharmacie *</label>
                      <input type="text" formControlName="pharmacyAddress" placeholder="Ex: 123 Rue de la Liberté, Ville" />
                    </div>
                    <div class="form-group">
                      <label>Téléphone de la pharmacie</label>
                      <input type="text" formControlName="pharmacyPhone" placeholder="Ex: 01 22 33 44 55" />
                    </div>
                    
                    <div class="location-picker">
                      <button type="button" class="location-btn" (click)="getCurrentLocation()" [disabled]="loading()">
                        <span class="icon">📍</span>
                        <span>{{ loading() ? 'Localisation...' : 'Obtenir ma position' }}</span>
                      </button>
                    </div>

                    <!-- Inline Google Map -->
                    @if (showMap()) {
                    <div class="map-wrapper">
                      <div class="map-container">
                        <google-map height="260px" width="100%" [options]="mapOptions" [center]="center()" [zoom]="zoom()">
                          <map-marker [position]="center()" title="Votre pharmacie"></map-marker>
                        </google-map>
                      </div>
                      <p class="map-caption">📍 Position confirmée sur la carte</p>
                    </div>
                    }
                    @if (mapError()) {
                    <div class="map-error-msg">⚠️ {{ mapError() }}</div>
                    }

                    <div class="form-row">
                      <div class="form-group"><input type="number" formControlName="latitude" placeholder="Latitude" step="any" /></div>
                      <div class="form-group"><input type="number" formControlName="longitude" placeholder="Longitude" step="any" /></div>
                    </div>

                    <div class="form-group checkbox-group">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="open24Hours" />
                        Ouvert 24h/7
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" class="submit-btn" [disabled]="loading() || registerForm.invalid">
                <span *ngIf="loading()" class="spinner"></span>
                <span *ngIf="!loading()">S'inscrire</span>
              </button>
            </form>
          </div>
        </div>

        <div *ngIf="message()" class="message" [class.success]="isSuccess()" [class.error]="!isSuccess()">
          <span>{{ message() }}</span>
          <button type="button" class="close-btn" (click)="message.set('')">×</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); position: relative; overflow: hidden; font-family: 'Inter', sans-serif; }
    #bg-canvas { position: absolute; inset: 0; z-index: 0; }
    .auth-card { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(10px); border: 1px solid #e2e8f0; border-radius: 40px; box-shadow: 0 40px 100px -20px rgba(15, 23, 42, 0.1); width: 100%; max-width: 500px; z-index: 10; padding: 3.5rem; color: #0f172a; opacity: 0; transform: scale(0.95) translateY(20px); animation: cardPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; max-height: 90vh; display: flex; flex-direction: column; }
    @keyframes cardPop { to { opacity: 1; transform: scale(1) translateY(0); } }
    .form-scroll-container { overflow-y: auto; flex: 1; padding-right: 5px; }

    .form-scroll-container::-webkit-scrollbar { width: 4px; }
    .form-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .auth-header h1 { margin: 0; font-size: 2.8rem; font-weight: 900; letter-spacing: -2px; color: #1e293b; margin-bottom: 0.5rem; text-align: center; }
    .subtitle { text-align: center; color: #64748b; margin-bottom: 2.5rem; font-weight: 500; }
    .mode-toggle { display: flex; background: #f1f5f9; border-radius: 20px; margin-bottom: 2.5rem; padding: 0.5rem; }
    .mode-toggle button { flex: 1; padding: 0.8rem; border: none; background: transparent; color: #64748b; font-weight: 700; cursor: pointer; border-radius: 15px; transition: all 0.3s; }
    .mode-toggle button.active { background: white; color: #0d9488; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.6rem; font-size: 0.9rem; font-weight: 600; color: #334155; }
    .form-group input { width: 100%; padding: 1rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 15px; font-size: 1rem; transition: all 0.3s; }
    .submit-btn { width: 100%; padding: 1.25rem; border: none; background: #0d9488; color: white; border-radius: 15px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; }
    .role-buttons { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .role-buttons button { flex: 1; padding: 0.75rem; border: 1px solid #e2e8f0; background: white; border-radius: 12px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #64748b; }
    .role-buttons button.active { border-color: #0d9488; color: #0d9488; background: rgba(13, 148, 136, 0.05); }
    .google-hint { text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; font-style: italic; }
    .google-only-container { background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1px dashed #cbd5e1; margin-bottom: 1.5rem; }
    .google-btn-container { display: flex; justify-content: center; margin-top: 0.5rem; min-height: 40px; }
    .otp-input { letter-spacing: 1rem; text-align: center; font-size: 1.5rem !important; font-weight: 800; }
    .specialization-select { width: 100%; padding: 1rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 15px; font-size: 1rem; transition: all 0.3s; background-color: white; color: #1e293b; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.2rem; }
    .specialization-select:focus { border-color: #0d9488; outline: none; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1); }
    .pharmacy-section { background: rgba(13, 148, 136, 0.03); padding: 1rem; border-radius: 15px; border: 1px solid rgba(13, 148, 136, 0.1); margin-top: 1rem; }
    .location-picker { margin-bottom: 1rem; }
    .location-btn { width: 100%; padding: 0.75rem; border: 1px dashed #0d9488; background: white; color: #0d9488; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
    .location-btn:hover { background: rgba(13, 148, 136, 0.05); }
    .sub-section-title { margin: 0 0 1rem 0; font-size: 0.95rem; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; }
    .message { margin-top: 1.5rem; padding: 1rem; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; font-weight: 600; }
    .message.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .message.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .forgot-password-link { margin-top: -1rem; margin-bottom: 1.5rem; text-align: right; }
    .forgot-password-link a { font-size: 0.85rem; color: #0d9488; font-weight: 600; cursor: pointer; text-decoration: none; }
    .forgot-password-link a:hover { text-decoration: underline; }
    .back-link { width: 100%; margin-top: 1rem; background: transparent; border: none; color: #64748b; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
    .back-link:hover { color: #1e293b; }
    .checkbox-group { margin-top: 1rem; }
    .checkbox-label { display: flex !important; align-items: center; gap: 0.5rem; cursor: pointer; color: #334155; font-size: 0.95rem; font-weight: 600; }
    .checkbox-label input { width: auto !important; margin: 0; cursor: pointer; }
    [hidden] { display: none !important; }
    
    .password-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
    .password-wrapper input { padding-right: 3.5rem; }
    .password-toggle-btn { position: absolute; right: 1rem; background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; padding: 0.5rem; font-size: 1.1rem; transition: all 0.2s; }
    .password-toggle-btn:hover { color: #0d9488; transform: scale(1.1); }
    .error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 0.35rem; font-weight: 500; display: block; text-align: left; padding-left: 0.5rem; }
    .input-error { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
    .password-hint { display: block; font-size: 0.7rem; color: #64748b; margin-top: 0.25rem; font-weight: 500; line-height: 1.2; padding-left: 0.5rem; }
    .server-error-banner { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 0.75rem 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600; text-align: center; }

    /* ── Inline Google Map ── */
    .map-wrapper { margin: 0.75rem 0 1rem; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(13,148,136,0.15); border: 2px solid rgba(13,148,136,0.2); }
    .map-container { width: 100%; height: 240px; background: #e8f5f3; }
    .map-caption { margin: 0; padding: 0.5rem 0.75rem; font-size: 0.78rem; color: #64748b; text-align: center; background: #f8fdfc; border-top: 1px solid rgba(13,148,136,0.1); }
    .map-error-msg { padding: 0.75rem 1rem; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 10px; font-size: 0.85rem; font-weight: 600; margin: 0.5rem 0; }
    .location-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `,
})
export class AuthComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  mode = signal<AuthMode>('login');
  selectedRole = signal<UserRole>('PATIENT');
  loading = signal(false);
  message = signal('');
  isSuccess = signal(false);
  showPassword = signal(false);
  showRegisterPassword = signal(false);
  serverError = signal<string | null>(null);
  animationState = signal<AnimationState>('TEXT_FORMING');

  // Google Maps inline state
  showMap = signal(false);
  mapError = signal<string | null>(null);
  private mapsScriptLoaded = false;
  private mapsScriptLoading = false;

  center = signal<google.maps.LatLngLiteral>({ lat: 36.8065, lng: 10.1815 }); // Default to Tunis
  zoom = signal(15);
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'cooperative'
  };


  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId!: number;
  private mouse = { x: -1000, y: -1000 };
  private textCanvas = document.createElement('canvas');
  private textCtx = this.textCanvas.getContext('2d', { willReadFrequently: true })!;
  tempGoogleToken: string | null = null;
  private renderInterval: any;
  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({ 
      email: ['', [Validators.required, Validators.email]], 
      password: ['', [Validators.required, Validators.minLength(6)]] 
    });
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[0-9])[a-zA-Z0-9@.\-_/%*]{6,15}$/)]],
      matricule: [''],
      specialization: [''],
      pharmacyName: [''],
      pharmacyAddress: [''],
      pharmacyPhone: [''],
      latitude: [null],
      longitude: [null],
      open24Hours: [false]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[0-9])[a-zA-Z0-9@.\-_/%*]{6,15}$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    effect(() => {
      const currentMode = this.mode();
      const currentRole = this.selectedRole();
      console.log('Auth State Change - Mode:', currentMode, 'Role:', currentRole);

      if (this.renderInterval) clearInterval(this.renderInterval);

      if (this.animationState() === 'BACKGROUND_ACTIVE') {
        this.renderGoogleButtons();
        let attempts = 0;
        this.renderInterval = setInterval(() => {
          this.renderGoogleButtons();
          if (++attempts > 10) clearInterval(this.renderInterval);
        }, 500);
      }
    });
  }

  // ── Google Maps helpers ──────────────────────────────────────

  /** Dynamically loads the Maps JS API script exactly once. */
  private loadGoogleMapsScript(): Promise<void> {
    // If already fully loaded (from any source), resolve immediately
    if ((window as any).google?.maps) {
      this.mapsScriptLoaded = true;
      this.mapsScriptLoading = false;
      return Promise.resolve();
    }
    if (this.mapsScriptLoaded) return Promise.resolve();
    if (this.mapsScriptLoading) {
      // Wait for the in-flight load to finish
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (this.mapsScriptLoaded) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(check); reject(new Error('Maps script timeout')); }, 10000);
      });
    }
    this.mapsScriptLoading = true;
    return new Promise((resolve, reject) => {
      // Avoid injecting a second <script> if one already exists
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) { this.mapsScriptLoaded = true; this.mapsScriptLoading = false; resolve(); return; }
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      const key = environment.googleMapsApiKey;
      // loading=async is the modern, recommended way to avoid blocking
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => { this.mapsScriptLoaded = true; this.mapsScriptLoading = false; resolve(); };
      script.onerror = () => { this.mapsScriptLoading = false; reject(new Error('Impossible de charger Google Maps. Vérifiez la clé API.')); };
      document.head.appendChild(script);
    });
  }

  getCurrentLocation() {
    if (!('geolocation' in navigator)) {
      this.mapError.set("La géolocalisation n'est pas supportée.");
      return;
    }

    this.loading.set(true);
    this.mapError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.ngZone.run(async () => {
          // Fill form fields
          this.registerForm.patchValue({ latitude: lat, longitude: lng });

          try {
            await this.loadGoogleMapsScript();
            this.center.set({ lat, lng });
            this.zoom.set(16);
            this.showMap.set(true);
            this.loading.set(false);
            this.message.set('Position détectée et affichée sur la carte.');
            this.isSuccess.set(true);
          } catch (err: any) {
            this.loading.set(false);
            this.mapError.set(err.message || "Erreur Google Maps.");
          }
        });
      },
      (error) => {
        this.ngZone.run(() => {
          this.loading.set(false);
          this.mapError.set('Géolocalisation refusée : ' + error.message);
          this.isSuccess.set(false);
        });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'reset-password' && params['token'] && params['email']) {
        this.mode.set('reset-password');
        this.message.set('Veuillez entrer votre nouveau mot de passe.');
        this.isSuccess.set(true);
      }
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  private redirectUserByRole(role: string) {
    this.auth.redirectUserByRole(role);
  }

  setMode(newMode: AuthMode) { this.mode.set(newMode); this.message.set(''); }
  getLoginIdentifierLabel() { return this.selectedRole() === 'PATIENT' ? 'Email Gmail' : 'Matricule / Email Gmail'; }
  getLoginIdentifierPlaceholder() { return 'votre@gmail.com'; }

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) { this.mouse.x = event.clientX; this.mouse.y = event.clientY; }
  @HostListener('window:resize') onResize() { this.initCanvas(); }

  ngAfterViewInit() {
    this.initCanvas(); this.animate();
    setTimeout(() => {
      this.animationState.set('EXPLODING'); this.explode();
      setTimeout(() => {
        this.animationState.set('BACKGROUND_ACTIVE');
        this.initGoogleAuth();
        setTimeout(() => this.renderGoogleButtons(), 200);
      }, 1000);
    }, 2500);
  }

  private initGoogleAuth() {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleCredentialResponse(response)
    });
  }

  private renderGoogleButtons() {
    if (this.selectedRole() !== 'PATIENT' || this.animationState() !== 'BACKGROUND_ACTIVE' || typeof google === 'undefined') return;

    const mode = this.mode();
    const btnId = mode === 'login' ? 'google-btn-login' : 'google-btn-register';
    const btnEl = document.getElementById(btnId);

    if (btnEl) {
      if (btnEl.querySelector('iframe')) return; // Already rendered

      console.log('--- Rendering Google Button ---', {
        mode,
        btnId,
        currentOrigin: window.location.origin,
        clientId: environment.googleClientId
      });

      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleCredentialResponse(response)
      });

      google.accounts.id.renderButton(btnEl, {
        theme: 'outline',
        size: 'large',
        width: 350,
        text: mode === 'login' ? 'signin_with' : 'signup_with',
        shape: 'pill'
      });
    }
  }

  private handleGoogleCredentialResponse(response: any) {
    this.loading.set(true);
    const idToken = response.credential;
    console.log('TRACE: handleGoogleCredentialResponse triggered');
    console.log('TRACE: Current Mode:', this.mode());
    console.log('TRACE: Google Response Object:', response);

    if (this.mode() === 'register') {
      console.log('TRACE: Attempting Google Registration with token...');
      this.api.initiateGoogleRegistration(idToken).subscribe({
        next: (res) => {
          console.log('TRACE: initiateGoogleRegistration SUCCESS', res);
          this.loading.set(false);
          this.tempGoogleToken = idToken;
          this.mode.set('otp-registration');
          console.log('TRACE: State changed to OTP Registration. Signaling UI update.');
          this.message.set('Bienvenue ! Veuillez vérifier le code envoyé à votre Gmail.');
        },
        error: (error) => {
          console.error('TRACE: initiateGoogleRegistration ERROR', error);
          this.loading.set(false);
          this.message.set(error.message || 'Échec de l\'inscription');
        }
      });
    } else {
      console.log('TRACE: Attempting Google Login with token...');
      this.api.loginWithGoogle({ idToken, role: 'PATIENT', email: '', name: '' }).subscribe({
        next: (res) => {
          console.log('TRACE: loginWithGoogle SUCCESS');
          this.auth.handleAuthSuccess(res); // Use AuthService now
          this.isSuccess.set(true);
          this.message.set('Bienvenue ! Redirection en cours...');
        },
        error: (error) => {
          console.error('TRACE: loginWithGoogle ERROR', error);
          this.loading.set(false);
          this.message.set(error.message);
        }
      });
    }
  }

  onVerifyRegistration(code: string) {
    this.loading.set(true);
    if (this.tempGoogleToken) {
      this.api.finalizeGoogleRegistration(this.tempGoogleToken, code).subscribe({
        next: (response) => {
          this.tempGoogleToken = null;
          this.auth.handleAuthSuccess(response); // Use AuthService now
          this.isSuccess.set(true);
          this.message.set('Inscription finalisée ! Bienvenue.');
        },
        error: (error) => { this.loading.set(false); this.message.set(error.message || 'Code invalide.'); }
      });
    }
  }

  onVerifyOtp(code: string) {
    this.loading.set(true);
    this.api.verifyOTP(this.loginForm.get('email')?.value, code).subscribe({
      next: (res) => {
        this.auth.handleAuthSuccess(res); // Use AuthService now
        this.isSuccess.set(true);
        this.message.set('Code vérifié avec succès !');
      },
      error: (error) => { this.loading.set(false); this.message.set(error.message); }
    });
  }

  private handleAuthSuccess(response: AuthResponse) {
    this.loading.set(false);
    this.isSuccess.set(true);
    this.message.set('Succès ! Redirection en cours...');

    // Save data
    localStorage.setItem('token', response.token || '');
    localStorage.setItem('user', JSON.stringify(response.user));

    const role = (response.user.role || '').toUpperCase();

    // Use a small timeout to let the success message be seen
    setTimeout(() => {
      if (role.includes('PHARMACIST')) {
        this.router.navigate(['/pharmacist/dashboard']);
      } else if (role.includes('DOCTOR')) {
        this.router.navigate(['/doctor']);
      } else if (role.includes('PATIENT')) {
        this.router.navigate(['/patient']);
      } else if (role.includes('ADMIN')) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
    }, 1500);
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    this.textCanvas.width = canvas.width; this.textCanvas.height = canvas.height;
    this.textCtx.fillStyle = 'black'; this.textCtx.font = `900 ${Math.min(canvas.width / 7, 100)}px 'Inter', sans-serif`;
    this.textCtx.textAlign = 'center'; this.textCtx.textBaseline = 'middle';
    this.textCtx.fillText('Medicoonect Pro', canvas.width / 2, canvas.height / 2);
    const pixelData = this.textCtx.getImageData(0, 0, canvas.width, canvas.height).data;
    const points: { x: number, y: number }[] = [];
    const gap = 4; // Restored to original density
    for (let y = 0; y < canvas.height; y += gap) {
      for (let x = 0; x < canvas.width; x += gap) if (pixelData[(y * canvas.width + x) * 4 + 3] > 128) points.push({ x, y });
    }
    this.particles = [];
    const maxParticles = 8000;
    const count = Math.min(Math.max(points.length, 1200), maxParticles);
    const colors = ['#0f766e', '#1e293b', '#0d9488'];
    for (let i = 0; i < count; i++) {
      const target = points[i] || { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
      this.particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        baseX: target.x, baseY: target.y, vx: 0, vy: 0,
        size: Math.random() * 2 + 1.5, density: (Math.random() * 20) + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2, driftX: (Math.random() - 0.5) * 0.1, driftY: (Math.random() - 0.5) * 0.1, opacity: 1
      });
    }
  }

  private explode() {
    const cx = this.canvasRef.nativeElement.width / 2; const cy = this.canvasRef.nativeElement.height / 2;
    for (let p of this.particles) {
      const dx = p.x - cx; const dy = p.y - cy; const d = Math.sqrt(dx * dx + dy * dy);
      p.vx = (dx / d) * 15 * (Math.random() + 0.5); p.vy = (dy / d) * 15 * (Math.random() + 0.5);
      p.color = ['#2dd4bf', '#0ea5e9', '#f8fafc'][Math.floor(Math.random() * 3)];
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    const state = this.animationState(); const canvas = this.canvasRef.nativeElement;
    for (let p of this.particles) {
      if (state === 'TEXT_FORMING') { p.x += (p.baseX - p.x) * 0.06; p.y += (p.baseY - p.y) * 0.06; }
      else if (state === 'EXPLODING') { p.vx *= 0.97; p.vy *= 0.97; p.x += p.vx; p.y += p.vy; }
      else {
        p.x += p.driftX; p.y += p.driftY;
        let dx = this.mouse.x - p.x; let dy = this.mouse.y - p.y; let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 1) { // Added min dist check to prevent Infinity
          const f = (200 - dist) / 200;
          p.vx -= (dx / dist) * f * 5;
          p.vy -= (dy / dist) * f * 5;
        }
        p.vx *= 0.90; p.vy *= 0.90; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      }
      this.ctx.fillStyle = p.color;
      // Restored circular particles as requested
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  onOtpInput(val: string) { if (val.length === 6) this.onVerifyOtp(val); }
  onOtpRegistrationInput(val: string) { if (val.length === 6) this.onVerifyRegistration(val); }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  hasError(group: 'login' | 'register', controlName: string): boolean {
    const form = group === 'login' ? this.loginForm : this.registerForm;
    const control = form.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getEmailError(group: 'login' | 'register'): string | null {
    const form = group === 'login' ? this.loginForm : this.registerForm;
    const control = form.get('email');
    if (control?.touched && control.invalid) {
      if (control.hasError('required')) return "L'email est requis.";
      if (control.hasError('email')) return 'Vérifier votre email';
    }
    return null;
  }

  onLogin() {
    if (this.selectedRole() === 'PATIENT') return;
    
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    // Use authService.login as requested
    this.auth.login({ ...this.loginForm.value, role: this.selectedRole() }).subscribe({
      next: (res) => {
        // Redirection handled by service tap
      },
      error: (err: HttpErrorResponse) => { 
        this.loading.set(false);
        this.isSuccess.set(false);
        
        // Prioritize backend-provided error messages
        const backendMessage = err.error?.error;
        
        if (backendMessage) {
          this.serverError.set(backendMessage);
        } else if (err.status === 0) {
          this.serverError.set('Impossible de se connecter au serveur.');
        } else {
          this.serverError.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  onRegister() {
    if (this.selectedRole() === 'PATIENT') return;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.message.set('Veuillez corriger les erreurs dans le formulaire.');
      this.isSuccess.set(false);
      return;
    }

    // Manual validation for role-specific requirements
    const role = this.selectedRole();
    const formValue = this.registerForm.value;

    if (role === 'PHARMACIST') {
      if (!formValue.pharmacyName || !formValue.pharmacyName.trim()) {
        this.message.set('Le nom de la pharmacie est requis.');
        this.isSuccess.set(false);
        return;
      }
      if (!formValue.pharmacyAddress || !formValue.pharmacyAddress.trim()) {
        this.message.set('L\'adresse de la pharmacie est requise.');
        this.isSuccess.set(false);
        return;
      }
    }

    this.loading.set(true);

    const payload = { ...formValue, role: role as any };

    // Route pharmacists to the dedicated endpoint that handles the pharmacy address correctly
    const request$ = role === 'PHARMACIST'
      ? this.api.registerPharmacist(payload)
      : this.api.register(payload);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.isSuccess.set(true);
        this.message.set('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        this.mode.set('login');
      },
      error: (error: any) => { 
        this.loading.set(false);
        this.isSuccess.set(false);
        if (error.status === 409) {
          this.message.set('Cet email est déjà utilisé.');
        } else {
          this.message.set(error.message || 'Échec de l\'inscription.');
        }
      }
    });
  }

  onForgotPassword() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.api.forgotPassword(this.forgotPasswordForm.value.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.isSuccess.set(true);
        this.message.set('Lien de réinitialisation envoyé ! Vérifiez votre Gmail.');
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(error.message);
      }
    });
  }

  onResetPassword() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }
    const email = this.route.snapshot.queryParams['email'];
    const token = this.route.snapshot.queryParams['token'];

    this.loading.set(true);
    this.api.resetPassword({
      email,
      token,
      newPassword: this.resetPasswordForm.value.password
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.isSuccess.set(true);
        this.message.set('Mot de passe mis à jour ! Vous pouvez vous connecter.');
        setTimeout(() => this.setMode('login'), 2000);
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(error.message);
      }
    });
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderInterval) clearInterval(this.renderInterval);
  }
}
