import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, UserResponse, DoctorResponse } from '../../core/services/api.service';
import { trigger, transition, style, animate } from '@angular/animations';

interface Stat {
  label: string;
  value: string;
  icon: string;
  color: string;
}

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

type ActiveTab = 'overview' | 'appointments' | 'patients' | 'profile';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="doctor-dashboard">
      <canvas #bgCanvas id="bg-canvas"></canvas>
      
      <!-- Premium Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">🩺</span>
            <h2>Mediconnect Pro</h2>
          </div>
        </div>

        <nav class="nav-links">
          <button [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
            <span class="icon">📊</span> Tableau de bord
          </button>
          <button [class.active]="activeTab() === 'appointments'" (click)="activeTab.set('appointments')">
            <span class="icon">📅</span> Mes Rendez-vous
          </button>
          <button [class.active]="activeTab() === 'patients'" (click)="activeTab.set('patients')">
            <span class="icon">👥</span> Mes Patients
          </button>
          <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
            <span class="icon">⚙️</span> Paramètres
          </button>
        </nav>

        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <span class="icon">🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <header class="content-header">
          <div class="user-info">
            <h1>Bienvenue, Dr. {{ user()?.name }}</h1>
            <p>Heureux de vous revoir sur votre plateforme de gestion professionnelle.</p>
          </div>
          <div class="header-actions">
            <div class="notif-badge">
              <span class="icon">🔔</span>
              <span class="count">3</span>
            </div>
            <div class="user-avatar" *ngIf="user()?.name">
              {{ user()?.name?.charAt(0) }}
            </div>
          </div>
        </header>

        <section class="tab-content" [ngSwitch]="activeTab()">
          
          <!-- OVERVIEW TAB -->
          <div *ngSwitchCase="'overview'" @fadeIn>
            <section class="stats-grid">
              @for (stat of stats(); track stat.label) {
                <div class="stat-card">
                  <div class="stat-icon" [style.background]="stat.color">
                    {{ stat.icon }}
                  </div>
                  <div class="stat-data">
                    <h3>{{ stat.label }}</h3>
                    <p>{{ stat.value }}</p>
                  </div>
                </div>
              }
            </section>

            <section class="appointment-section">
              <div class="section-card">
                <h2>Prochains Rendez-vous</h2>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Heure</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (apt of upcomingAppointments(); track apt.id) {
                        <tr>
                          <td>{{ apt.patientName }}</td>
                          <td>{{ apt.dateTime | date:'dd/MM/yyyy HH:mm' }}</td>
                          <td>Consultation</td>
                          <td><span class="status-badge" [class.urgent]="apt.status === 'urgent'">{{ apt.status }}</span></td>
                          <td><button class="btn-action">Consulter</button></td>
                        </tr>
                      }
                      @if (upcomingAppointments().length === 0) {
                        <tr>
                          <td colspan="5" style="text-align: center; padding: 2rem;">Aucun rendez-vous prévu.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          <!-- APPOINTMENTS TAB -->
          <div *ngSwitchCase="'appointments'" @fadeIn>
            <div class="section-card">
              <h2>📅 Tous mes Rendez-vous</h2>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date & Heure</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (apt of appointments(); track apt.id) {
                      <tr>
                        <td>{{ apt.patientName }}</td>
                        <td>{{ apt.dateTime | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td><span class="status-badge">{{ apt.status }}</span></td>
                        <td>
                          <div class="btn-group">
                            <button class="btn-action" *ngIf="apt.status === 'PENDING'" (click)="confirmAppointment(apt.id)">Confirmer</button>
                            <button class="btn-action cancel" *ngIf="apt.status === 'PENDING'" (click)="cancelAppointment(apt.id)">Annuler</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- PATIENTS TAB -->
          <div *ngSwitchCase="'patients'" @fadeIn>
            <div class="section-card">
              <h2>👥 Mes Patients</h2>
              <div class="patients-grid">
                @for (patient of patients(); track patient.email) {
                  <div class="patient-card">
                    <div class="patient-avatar">{{ patient.name.charAt(0) }}</div>
                    <div class="patient-info">
                      <h3>{{ patient.name }}</h3>
                      <p>{{ patient.email }}</p>
                      <span class="status-badge">Patient</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- PROFILE TAB -->
          <div *ngSwitchCase="'profile'" @fadeIn class="profile-container">
            <!-- Header Section -->
            <div class="profile-header-card">
              <div class="profile-cover"></div>
              <div class="profile-info-wrap">
                <div class="profile-avatar-wrapper">
                   <!-- Priority: Preview URL > Backend URL -->
                  <img *ngIf="previewUrl() || fullDoctorData()?.profilePhoto; else textAvatar" 
                       [src]="previewUrl() || getFullPhotoUrl(fullDoctorData()?.profilePhoto)" 
                       class="profile-photo" alt="Profile">
                  
                  <ng-template #textAvatar>
                    <div class="user-avatar-large">{{ user()?.name?.charAt(0) }}</div>
                  </ng-template>

                  <!-- Status Overlay during Upload -->
                  <div class="upload-overlay" *ngIf="isUploading()">
                    <div class="spinner"></div>
                  </div>

                  <button class="upload-photo-btn" (click)="fileInput.click()" *ngIf="!selectedFile() && !isUploading()">
                    <span>📷</span>
                  </button>
                  <input type="file" #fileInput hidden (change)="onPhotoSelected($event)" accept="image/*">
                  
                  <!-- Validation Controls -->
                  <div class="photo-controls" *ngIf="selectedFile() && !isUploading()">
                    <button class="btn-confirm" (click)="uploadPhoto()" title="Valider">✅</button>
                    <button class="btn-cancel-mini" (click)="cancelSelection()" title="Annuler">✖</button>
                  </div>
                </div>
                <div class="profile-details">
                  <div class="name-status">
                    <h2>Dr. {{ displayFirstName() }} {{ displayLastName() }}</h2>
                    <span class="status-badge" [class.active]="fullDoctorData()?.statut === 'actif' || fullDoctorData()?.statut === 'APPROVED'">
                      {{ fullDoctorData()?.statut || 'PENDING' }}
                    </span>
                  </div>
                  <p class="specialization"><span class="icon">⚕️</span> {{ fullDoctorData()?.specialization || 'Médecin Généraliste' }}</p>
                  <p class="member-since">Membre depuis: {{ (fullDoctorData()?.createdAt | date:'longDate') || '2026' }}</p>
                </div>
                <div class="profile-actions">
                  <button class="btn-action primary" (click)="openEditModal()">
                     Modifier le profil
                  </button>
                </div>
              </div>
            </div>

            <!-- Content Grid -->
            <div class="profile-grid">
              <!-- Left Col: Personal & Contact -->
              <div class="profile-left">
                <div class="section-card">
                  <h3 class="section-title">Informations Personnelles</h3>
                  <div class="info-list">
                    <div class="info-item">
                      <span class="info-label">Nom Complet</span>
                      <span class="info-value">{{ displayFirstName() }} {{ displayLastName() }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Email</span>
                      <span class="info-value">{{ fullDoctorData()?.email || user()?.email }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Sexe</span>
                      <span class="info-value">{{ fullDoctorData()?.gender || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Date de naissance</span>
                      <span class="info-value">{{ fullDoctorData()?.dateOfBirth ? (fullDoctorData()?.dateOfBirth | date:'dd/MM/yyyy') : 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Groupe Sanguin</span>
                      <span class="info-value blood-group">{{ fullDoctorData()?.bloodGroup || 'N/A' }}</span>
                    </div>
                  </div>
                </div>

                <div class="section-card">
                  <h3 class="section-title">Contact & Cabinet</h3>
                  <div class="info-list">
                    <div class="info-item">
                      <span class="info-label">Téléphone</span>
                      <span class="info-value">{{ fullDoctorData()?.phone || 'Non spécifié' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Adresse Cabinet</span>
                      <span class="info-value">{{ fullDoctorData()?.address || 'Non spécifié' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Col: Professional, Stats -->
              <div class="profile-right">
                <div class="stats-row">
                  <div class="stat-box">
                    <div class="stat-icon patient-icon">👥</div>
                    <div class="stat-info">
                      <h4>Total Patients</h4>
                      <p>{{ patients().length }}</p>
                    </div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-icon rdv-icon">📅</div>
                    <div class="stat-info">
                      <h4>RDV Totaux</h4>
                      <p>{{ appointments().length }}</p>
                    </div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-icon rating-icon">⭐</div>
                    <div class="stat-info">
                      <h4>Note Moyenne</h4>
                      <p>4.8/5</p>
                    </div>
                  </div>
                </div>

                <div class="section-card">
                  <h3 class="section-title">Informations Professionnelles</h3>
                  <div class="info-list">
                    <div class="info-item">
                      <span class="info-label">Spécialité Principale</span>
                      <span class="info-value">{{ fullDoctorData()?.specialization || 'Médecin' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Numéro d'Ordre</span>
                      <span class="info-value">{{ fullDoctorData()?.licenseNumber || fullDoctorData()?.numeroOrdre || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Années d'expérience</span>
                      <span class="info-value">{{ fullDoctorData()?.experienceYears || 0 }} ans</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Frais de consultation</span>
                      <span class="info-value">{{ fullDoctorData()?.consultationFee || 'Standard' }} DT</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Langues parlées</span>
                      <span class="info-value">{{ fullDoctorData()?.languagesSpoken || 'Arabe, Français' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- EDIT PROFILE MODAL -->
          <div class="modal-overlay" *ngIf="showEditModal()" @fadeIn>
            <div class="modal-content">
              <div class="modal-header">
                <h2>Modifier le Profil</h2>
                <button class="close-btn" (click)="closeEditModal()">✖</button>
              </div>
              <form [formGroup]="editProfileForm" (ngSubmit)="saveProfile()">
                <div class="form-tabs">
                  <button type="button" [class.active]="editTab() === 'personal'" (click)="editTab.set('personal')">Personnel</button>
                  <button type="button" [class.active]="editTab() === 'professional'" (click)="editTab.set('professional')">Professionnel</button>
                  <button type="button" [class.active]="editTab() === 'security'" (click)="editTab.set('security')">Sécurité</button>
                </div>
                <div class="form-body" [ngSwitch]="editTab()">
                  <!-- Personal Tab -->
                  <div *ngSwitchCase="'personal'" class="form-grid">
                    <div class="form-group">
                      <label>Prénom</label>
                      <input type="text" formControlName="firstName" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Nom</label>
                      <input type="text" formControlName="lastName" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Email</label>
                      <input type="email" formControlName="email" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Téléphone</label>
                      <input type="text" formControlName="phone" class="form-control">
                    </div>
                    <div class="form-group full-width">
                      <label>Adresse</label>
                      <input type="text" formControlName="address" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Sexe</label>
                      <select formControlName="gender" class="form-control">
                        <option value="HOMME">Homme</option>
                        <option value="FEMME">Femme</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Date de naissance</label>
                      <input type="date" formControlName="dateOfBirth" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Groupe Sanguin</label>
                      <select formControlName="bloodGroup" class="form-control">
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <!-- Professional Tab -->
                  <div *ngSwitchCase="'professional'" class="form-grid">
                    <div class="form-group">
                      <label>Spécialité</label>
                      <input type="text" formControlName="specialization" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Numéro d'Ordre</label>
                      <input type="text" formControlName="licenseNumber" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Années d'expérience</label>
                      <input type="number" formControlName="experienceYears" class="form-control">
                    </div>
                    <div class="form-group">
                      <label>Frais de Consultation</label>
                      <input type="number" formControlName="consultationFee" class="form-control">
                    </div>
                    <div class="form-group full-width">
                      <label>Langues Parlées</label>
                      <input type="text" formControlName="languagesSpoken" class="form-control">
                    </div>
                  </div>

                  <!-- Security Tab -->
                  <div *ngSwitchCase="'security'" class="form-grid">
                    <div class="form-group full-width">
                      <label>Mot de passe actuel</label>
                      <input type="password" formControlName="currentPassword" class="form-control" placeholder="Laisser vide si inchangé">
                    </div>
                    <div class="form-group full-width">
                      <label>Nouveau mot de passe</label>
                      <input type="password" formControlName="newPassword" class="form-control">
                    </div>
                    <div class="form-group full-width">
                      <label>Confirmer le nouveau mot de passe</label>
                      <input type="password" formControlName="confirmPassword" class="form-control">
                    </div>
                  </div>
                </div>

                <div class="modal-footer">
                  <button type="button" class="btn-cancel" (click)="closeEditModal()">Annuler</button>
                  <button type="submit" class="btn-save" [disabled]="editProfileForm.invalid || isSaving()">
                    {{ isSaving() ? 'Enregistrement...' : 'Enregistrer' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </section>
      </main>
    </div>
  `,
  styles: `
    :host { 
      --primary: #0d9488; 
      --primary-light: #2dd4bf; 
      --bg: #f8fafc; 
      --sidebar: rgba(255, 255, 255, 0.95); 
      --text-main: #1e293b; 
      --text-sub: #64748b; 
      --card-bg: rgba(255, 255, 255, 0.9);
      --glass-border: rgba(226, 232, 240, 0.8);
    }
    
    .doctor-dashboard { display: flex; min-height: 100vh; background: var(--bg); color: var(--text-main); font-family: 'Inter', sans-serif; position: relative; overflow: hidden; }
    #bg-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.6; }

    /* Sidebar Styles */
    .sidebar { width: 280px; background: var(--sidebar); border-right: 1px solid var(--glass-border); display: flex; flex-direction: column; z-index: 10; padding: 2.5rem 1.5rem; backdrop-filter: blur(20px); box-shadow: 10px 0 30px rgba(0,0,0,0.02); }
    .sidebar-header { margin-bottom: 3.5rem; }
    .logo { display: flex; align-items: center; gap: 0.75rem; justify-content: center; }
    .logo-icon { font-size: 2.2rem; }
    .logo h2 { margin: 0; font-size: 1.5rem; font-weight: 900; color: #1e293b; letter-spacing: -1.5px; }

    .nav-links { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
    .nav-links button { display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.25rem; border: none; background: transparent; color: var(--text-sub); font-weight: 700; cursor: pointer; border-radius: 16px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); text-align: left; }
    .nav-links button:hover { background: rgba(13, 148, 136, 0.05); color: var(--primary); transform: translateX(5px); }
    .nav-links button.active { background: #0d9488; color: white; box-shadow: 0 10px 20px rgba(13, 148, 136, 0.2); }
    .nav-links .icon { font-size: 1.3rem; }

    .logout-btn { display: flex; align-items: center; gap: 1rem; width: 100%; padding: 1.1rem; border: none; background: #fef2f2; color: #ef4444; font-weight: 800; border-radius: 16px; cursor: pointer; transition: all 0.3s; justify-content: center; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.05); }
    .logout-btn:hover { background: #fee2e2; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(239, 68, 68, 0.1); }

    /* Content Area */
    .main-content { flex: 1; position: relative; z-index: 1; padding: 3rem 4rem; overflow-y: auto; max-height: 100vh; }
    .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
    .user-info h1 { margin: 0; font-size: 2.2rem; font-weight: 900; color: #1e293b; letter-spacing: -1px; }
    .user-info p { margin: 0.5rem 0 0; color: var(--text-sub); font-size: 1.1rem; }
    
    .header-actions { display: flex; align-items: center; gap: 2rem; }
    .notif-badge { position: relative; font-size: 1.8rem; cursor: pointer; color: var(--text-sub); transition: 0.3s; }
    .notif-badge:hover { color: var(--primary); }
    .notif-badge .count { position: absolute; top: -5px; right: -5px; background: #f43f5e; color: white; font-size: 0.75rem; padding: 3px 7px; border-radius: 10px; font-weight: 900; border: 2px solid white; }
    .user-avatar { width: 50px; height: 50px; background: linear-gradient(135deg, #0d9488, #2dd4bf); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; box-shadow: 0 10px 20px rgba(13, 148, 136, 0.3); }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2rem; margin-bottom: 3.5rem; }
    .stat-card { background: var(--card-bg); padding: 2rem; border-radius: 30px; border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 1.5rem; backdrop-filter: blur(10px); box-shadow: 0 20px 40px rgba(0,0,0,0.03); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .stat-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 30px 60px rgba(13, 148, 136, 0.08); }
    .stat-icon { width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
    .stat-data h3 { margin: 0; font-size: 0.9rem; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
    .stat-data p { margin: 0.25rem 0 0; font-weight: 900; color: #1e293b; font-size: 1.8rem; }

    /* Tables */
    .section-card { background: var(--card-bg); border-radius: 35px; border: 1px solid var(--glass-border); padding: 2.5rem; backdrop-filter: blur(10px); box-shadow: 0 20px 40px rgba(0,0,0,0.03); margin-bottom: 2rem; }
    .section-card h2 { margin-bottom: 2rem; font-size: 1.4rem; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
    th { text-align: left; padding: 1.2rem; color: var(--text-sub); font-size: 0.95rem; font-weight: 700; border-bottom: 2px solid #f1f5f9; }
    td { padding: 1.2rem; background: rgba(255,255,255,0.4); border-top: 1px solid var(--glass-border); border-bottom: 1px solid var(--glass-border); }
    td:first-child { border-left: 1px solid var(--glass-border); border-radius: 12px 0 0 12px; }
    td:last-child { border-right: 1px solid var(--glass-border); border-radius: 0 12px 12px 0; }
    
    .status-badge { padding: 6px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 800; background: #f0fdf4; color: #166534; }
    .status-badge.urgent { background: #fef2f2; color: #991b1b; }
    .btn-action { background: white; border: 1.5px solid #e2e8f0; color: #1e293b; padding: 8px 20px; border-radius: 12px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: all 0.3s; }
    .btn-action:hover { background: #0d9488; color: white; border-color: #0d9488; transform: scale(1.05); }
    .btn-action.cancel { color: #dc2626; border-color: #fecaca; }
    .btn-action.cancel:hover { background: #fee2e2; border-color: #fca5a5; }
    .btn-group { display: flex; gap: 0.5rem; }

    /* Patients Grid */
    .patients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .patient-card { background: white; padding: 1.5rem; border-radius: 20px; border: 1px solid var(--glass-border); display: flex; gap: 1rem; align-items: center; transition: 0.3s; }
    .patient-card:hover { transform: translateY(-5px); border-color: var(--primary); }
    .patient-avatar { width: 50px; height: 50px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary); font-size: 1.2rem; }
    .patient-info h3 { margin: 0; font-size: 1rem; }
    .patient-info p { margin: 0; font-size: 0.85rem; color: var(--text-sub); }

    /* New Profile Design */
    .profile-container { display: flex; flex-direction: column; gap: 2rem; }
    .profile-header-card { background: var(--card-bg); border-radius: 35px; border: 1px solid var(--glass-border); overflow: hidden; backdrop-filter: blur(10px); box-shadow: 0 20px 40px rgba(0,0,0,0.03); margin-bottom: 2rem; }
    .profile-cover { height: 160px; background: linear-gradient(135deg, var(--primary), #1e293b); position: relative; }
    .profile-info-wrap { padding: 0 2.5rem 2.5rem; display: flex; gap: 2rem; align-items: flex-end; margin-top: -60px; }
    .profile-avatar-wrapper { position: relative; width: 140px; height: 140px; border-radius: 25px; border: 6px solid white; background: white; box-shadow: 0 15px 35px rgba(0,0,0,0.1); flex-shrink: 0; }
    .profile-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 19px; }
    .user-avatar-large { width: 100%; height: 100%; background: linear-gradient(135deg, #0d9488, #2dd4bf); color: white; display: flex; justify-content: center; align-items: center; font-size: 3.5rem; font-weight: 900; border-radius: 19px; }
    .upload-photo-btn { position: absolute; bottom: -5px; right: -5px; width: 40px; height: 40px; background: var(--primary); color: white; border: none; border-radius: 12px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(13,148,136,0.3); transition: 0.3s; }
    .upload-photo-btn:hover { transform: scale(1.1); }
    
    .photo-controls { position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; background: white; padding: 5px; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border: 1px solid var(--glass-border); z-index: 10; }
    .btn-confirm { background: #10b981; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1rem; transition: 0.3s; }
    .btn-confirm:hover { background: #059669; transform: scale(1.1); }
    .btn-cancel-mini { background: #f43f5e; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 0.8rem; transition: 0.3s; }
    .btn-cancel-mini:hover { background: #e11d48; transform: scale(1.1); }

    .upload-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; justify-content: center; align-items: center; border-radius: 19px; z-index: 5; }
    .spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .profile-details { flex: 1; margin-bottom: 0.5rem; }
    .name-status { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
    .name-status h2 { margin: 0; font-size: 2rem; font-weight: 900; color: var(--text-main); letter-spacing: -0.5px; }
    .specialization { margin: 0 0 0.5rem; font-size: 1.1rem; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    .member-since { margin: 0; font-size: 0.9rem; color: var(--text-sub); }
    .profile-actions { margin-bottom: 1rem; }
    .btn-action.primary { background: var(--primary); color: white; border-color: var(--primary); padding: 12px 24px; font-size: 1rem; }
    .btn-action.primary:hover { background: #0f766e; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(13,148,136,0.2); }

    .profile-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0 0 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--glass-border); }
    .info-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .info-label { font-size: 0.85rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 1.05rem; color: var(--text-main); font-weight: 600; }
    .blood-group { display: inline-block; padding: 4px 12px; background: #fef2f2; color: #dc2626; border-radius: 8px; font-weight: 800; font-size: 0.9rem; align-self: flex-start; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-box { background: var(--card-bg); border-radius: 20px; border: 1px solid var(--glass-border); padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
    .stat-box:hover { transform: translateY(-5px); border-color: var(--primary); }
    .stat-icon { width: 45px; height: 45px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.4rem; }
    .patient-icon { background: #eff6ff; color: #3b82f6; }
    .rdv-icon { background: #f0fdf4; color: #22c55e; }
    .rating-icon { background: #fefce8; color: #eab308; }
    .stat-info h4 { margin: 0; font-size: 0.8rem; color: var(--text-sub); text-transform: uppercase; font-weight: 700; }
    .stat-info p { margin: 0.2rem 0 0; font-size: 1.5rem; font-weight: 900; color: var(--text-main); }

    /* Modal Styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 2rem; }
    .modal-content { background: white; width: 100%; max-width: 800px; border-radius: 30px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.25); max-height: 90vh; display: flex; flex-direction: column; }
    .modal-header { padding: 2rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
    .modal-header h2 { margin: 0; font-size: 1.5rem; font-weight: 900; color: var(--text-main); }
    .close-btn { background: transparent; border: none; font-size: 1.5rem; color: var(--text-sub); cursor: pointer; transition: 0.3s; }
    .close-btn:hover { color: #dc2626; transform: rotate(90deg); }
    
    .form-tabs { display: flex; gap: 1rem; padding: 0 2rem; background: #f8fafc; border-bottom: 1px solid var(--glass-border); }
    .form-tabs button { background: transparent; border: none; padding: 1.2rem 1rem; font-size: 1rem; font-weight: 700; color: var(--text-sub); border-bottom: 3px solid transparent; cursor: pointer; transition: 0.3s; }
    .form-tabs button.active { color: var(--primary); border-bottom-color: var(--primary); }
    
    form { display: flex; flex-direction: column; overflow: hidden; flex: 1; margin: 0; }
    .form-body { padding: 2rem; overflow-y: auto; flex: 1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-sub); }
    .form-control { padding: 0.9rem 1.2rem; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 1rem; font-family: 'Inter', sans-serif; transition: 0.3s; background: #f8fafc; }
    .form-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(13,148,136,0.1); background: white; }
    
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc; margin-top: auto; }
    .btn-cancel { padding: 0.9rem 1.5rem; border-radius: 12px; border: 1px solid #cbd5e1; background: white; font-weight: 700; color: var(--text-main); cursor: pointer; transition: 0.3s; }
    .btn-cancel:hover { background: #f1f5f9; }
    .btn-save { padding: 0.9rem 2rem; border-radius: 12px; border: none; background: var(--primary); font-weight: 700; color: white; cursor: pointer; transition: 0.3s; }
    .btn-save:hover:not([disabled]) { background: #0f766e; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(13,148,136,0.2); }
    .btn-save[disabled] { opacity: 0.7; cursor: not-allowed; }

    @media (max-width: 1024px) {
      .sidebar { width: 100px; padding: 2rem 1rem; }
      .sidebar h2, .nav-links button span:last-child, .sidebar-footer button span:last-child { display: none; }
      .nav-links button { justify-content: center; padding: 1.2rem; }
      .main-content { padding: 2rem; }
    }
  `,
})
export class DoctorDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  user = signal<UserResponse | null>(null);
  activeTab = signal<ActiveTab>('overview');
  appointments = signal<any[]>([]);
  upcomingAppointments = signal<any[]>([]);
  patients = signal<any[]>([]);
  stats = signal<Stat[]>([
    { label: 'Patient Totaux', value: '0', icon: '👥', color: 'rgba(59, 130, 246, 0.1)' },
    { label: 'RDV Aujourd\'hui', value: '0', icon: '📅', color: 'rgba(13, 148, 136, 0.1)' },
    { label: 'Avis Patients', value: '4.8/5', icon: '⭐', color: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Temps Moyen', value: '25 min', icon: '⌛', color: 'rgba(139, 92, 246, 0.1)' }
  ]);

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId!: number;
  private mouse = { x: -1000, y: -1000 };

  fullDoctorData = signal<DoctorResponse | null>(null);
  editTab = signal<'personal' | 'professional' | 'security'>('personal');
  showEditModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  editProfileForm!: FormGroup;

  constructor(private router: Router, private api: ApiService, private fb: FormBuilder) {
    this.initForm();
  }

  initForm() {
    this.editProfileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      gender: [''],
      dateOfBirth: [''],
      bloodGroup: [''],
      specialization: [''],
      licenseNumber: [''],
      experienceYears: [''],
      consultationFee: [''],
      languagesSpoken: [''],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  getFirstName(): string {
    return this.fullDoctorData()?.firstName || this.user()?.name?.split(' ')[0] || '';
  }

  getLastName(): string {
    const parts = this.user()?.name?.split(' ') || [];
    return this.fullDoctorData()?.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '');
  }

  displayFirstName(): string { return this.getFirstName(); }
  displayLastName(): string { return this.getLastName(); }

  getFullPhotoUrl(photoPath: string | null | undefined): string {
    if (!photoPath) return '';
    if (photoPath.startsWith('data:') || photoPath.startsWith('http')) return photoPath;

    // Build URL from backend base
    const baseUrl = 'http://localhost:8081'; // Should ideally come from environment
    return `${baseUrl}${photoPath}${photoPath.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
  }

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      this.user.set(userData);
      this.fullDoctorData.set(userData);
      this.loadData(userData.id);

      this.api.getUserById(userData.id, 'DOCTOR').subscribe({
        next: (res: any) => {
          const updated = { ...this.fullDoctorData(), ...res };
          this.fullDoctorData.set(updated);
          this.editProfileForm.patchValue(updated);
        }
      });
    } else {
      this.router.navigate(['/auth']);
    }
  }

  openEditModal() {
    this.editProfileForm.patchValue(this.fullDoctorData() || {});
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('L\'image est trop volumineuse (max 2Mo)');
        return;
      }
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  cancelSelection() {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  uploadPhoto() {
    const file = this.selectedFile();
    const user = this.user();
    if (!file || !user) return;

    this.isUploading.set(true);
    this.api.uploadDoctorPhoto(user.id, file).subscribe({
      next: (res: any) => {
        // Backend now returns photoUrl like "/api/profiles/photo/filename.jpg"
        const photoUrl = res.photoUrl || res.filename;

        // Force refresh by updating signals with the NEW path
        const updated = { ...this.fullDoctorData(), profilePhoto: photoUrl } as DoctorResponse;
        this.fullDoctorData.set(updated);

        // Persist to local storage
        localStorage.setItem('user', JSON.stringify(updated));

        // Update header user signal if needed
        this.user.set(updated as UserResponse);

        this.cancelSelection();
        this.isUploading.set(false);
        alert('Photo mise à jour avec succès');
      },
      error: (err) => {
        console.error('Upload error:', err);
        alert('Erreur lors du téléchargement : ' + err.message);
        this.isUploading.set(false);
      }
    });
  }

  saveProfile() {
    if (this.editProfileForm.invalid) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }
    this.isSaving.set(true);

    const data = this.editProfileForm.value;
    const currentData = this.fullDoctorData();
    if (currentData && currentData.profilePhoto) {
      data.profilePhoto = currentData.profilePhoto;
    }

    if (!this.user()) {
      this.isSaving.set(false);
      return;
    }

    this.api.updateDoctorProfile(this.user()!.id, data).subscribe({
      next: (response) => {
        const merged = { ...currentData, ...response };
        this.fullDoctorData.set(merged);
        this.user.set(merged as UserResponse);
        localStorage.setItem('user', JSON.stringify(merged));
        this.isSaving.set(false);
        this.closeEditModal();
        alert('Profil mis à jour avec succès');
      },
      error: (err) => {
        alert('Erreur lors de la mise à jour : ' + err.message);
        this.isSaving.set(false);
      }
    });
  }

  loadData(doctorId: number) {
    this.api.getAppointmentsByDoctor(doctorId).subscribe({
      next: (res: any[]) => {
        this.appointments.set(res);
        this.upcomingAppointments.set(res.filter(a => a.statut === 'PENDING').slice(0, 5));

        const uniquePatients = Array.from(new Set(res.map(a => a.userId)))
          .map(id => {
            const apt = res.find(a => a.userId === id);
            return { id: apt.userId, name: apt.userName, email: apt.userEmail };
          });
        this.patients.set(uniquePatients);

        this.stats.update(s => {
          s[0].value = uniquePatients.length.toString();
          s[1].value = res.filter(a => {
            const today = new Date().toISOString().split('T')[0];
            return a.dateDemande && a.dateDemande.startsWith(today);
          }).length.toString();
          return [...s];
        });
      },
      error: (err) => console.error('Error loading doctor data:', err)
    });
  }

  confirmAppointment(id: number) {
    if (!confirm('Confirmer ce rendez-vous ?')) return;
    this.api.acceptDemande(id).subscribe({
      next: () => {
        alert('Rendez-vous confirmé');
        if (this.user()) this.loadData(this.user()!.id);
      },
      error: (err) => alert('Erreur: ' + err.message)
    });
  }

  cancelAppointment(id: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.api.rejectDemande(id).subscribe({
      next: () => {
        alert('Rendez-vous annulé');
        if (this.user()) this.loadData(this.user()!.id);
      },
      error: (err) => alert('Erreur: ' + err.message)
    });
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  @HostListener('window:resize')
  onResize() { this.initCanvas(); }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    this.createParticles();
  }

  private createParticles() {
    this.particles = [];
    const quantity = 50;
    const colors = ['#0f766e', '#1e293b', '#0d9488'];
    for (let i = 0; i < quantity; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      this.particles.push({
        x, y, baseX: x, baseY: y,
        vx: 0, vy: 0,
        size: Math.random() * 2 + 1.5,
        density: (Math.random() * 20) + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.1,
        opacity: 1
      });
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    const canvas = this.canvasRef.nativeElement;

    for (let p of this.particles) {
      p.x += p.driftX; p.y += p.driftY;
      let dx = this.mouse.x - p.x; let dy = this.mouse.y - p.y; let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200 && dist > 1) {
        const f = (200 - dist) / 200;
        p.vx -= (dx / dist) * f * 5;
        p.vy -= (dy / dist) * f * 5;
      }
      p.vx *= 0.90; p.vy *= 0.90; p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0; if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;

      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth']);
  }
}
