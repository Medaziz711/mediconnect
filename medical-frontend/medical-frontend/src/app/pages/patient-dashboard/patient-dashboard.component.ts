import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, UserResponse, DoctorResponse } from '../../core/services/api.service';
import { PharmacySearchComponent } from '../../components/pharmacy-search/pharmacy-search.component';
import { DoctorRatingComponent } from '../../components/doctor-rating/doctor-rating.component';

type ActiveTab = 'overview' | 'search' | 'appointments' | 'pharmacies' | 'profile';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PharmacySearchComponent, DoctorRatingComponent],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="patient-dashboard">
      <div class="glass-bg"></div>
      
      <!-- Premium Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">🏥</span>
            <h2>Mediconnect</h2>
          </div>
        </div>

        <nav class="nav-links">
          <button [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
            <span class="icon">🏠</span> Vue d'ensemble
          </button>
          <button [class.active]="activeTab() === 'search'" (click)="activeTab.set('search')">
            <span class="icon">🔍</span> Trouver un Docteur
          </button>
          <button [class.active]="activeTab() === 'appointments'" (click)="activeTab.set('appointments')">
            <span class="icon">📅</span> Mes Rendez-vous
          </button>
          <button [class.active]="activeTab() === 'pharmacies'" (click)="activeTab.set('pharmacies')">
            <span class="icon">💊</span> Pharmacies
          </button>
          <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
            <span class="icon">👤</span> Mon Profil
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
            <h1>Bonjour, {{ user()?.name }}</h1>
            <p>Bienvenue dans votre espace santé personnalisé.</p>
          </div>
          <div class="header-actions">
            <div class="notif-badge">
              <span class="icon">🔔</span>
              <span class="count">2</span>
            </div>
            <div class="user-avatar">
              {{ user()?.name?.charAt(0) }}
            </div>
          </div>
        </header>

        <section class="tab-content" [ngSwitch]="activeTab()">
          
          <!-- OVERVIEW TAB -->
          <div *ngSwitchCase="'overview'" class="overview-grid" @fadeIn>
            <div class="hero-card">
              <div class="hero-text">
                <h2>Votre santé, notre priorité</h2>
                <p>Retrouvez vos médecins préférés et trouvez la pharmacie la plus proche en quelques clics.</p>
                <button class="cta-btn" (click)="activeTab.set('search')">Vérifier mes RDV</button>
              </div>
              <div class="hero-img">🩺</div>
            </div>

            <div class="quick-stats">
              <div class="stat-card">
                <span class="stat-icon calendar">📅</span>
                <div class="stat-info">
                  <h3>Prochain RDV</h3>
                  <p>{{ nextAppointment() ? (nextAppointment()?.dateTime | date:'dd MMM, HH:mm') : 'Aucun prévu' }}</p>
                </div>
              </div>
              <div class="stat-card">
                <span class="stat-icon heart">❤️</span>
                <div class="stat-info">
                  <h3>Santé</h3>
                  <p>Stable</p>
                </div>
              </div>
            </div>

            <div class="actions-grid">
              <div class="action-card" (click)="activeTab.set('search')">
                <span class="action-icon">🤝</span>
                <h3>Chercher un Docteur</h3>
                <p>Plus de 500 spécialistes disponibles</p>
              </div>
              <div class="action-card" (click)="activeTab.set('pharmacies')">
                <span class="action-icon">💊</span>
                <h3>Pharmacie de garde</h3>
                <p>Localiser les pharmacies proches</p>
              </div>
            </div>
          </div>

          <!-- SEARCH TAB -->
          <div *ngSwitchCase="'search'" class="appointments-view" @fadeIn>
            <div class="search-bar-inline">
              <input type="text" [ngModel]="doctorSearchQuery()" (ngModelChange)="doctorSearchQuery.set($event)" placeholder="Chercher par nom ou spécialité...">
              <button class="filter-btn">🔍</button>
            </div>

            <div class="doctors-grid">
              @for (doc of filteredDoctors(); track doc.id) {
                <div class="doctor-card">
                  <div class="doc-header">
                    <div class="doc-avatar">{{ doc.name.charAt(0) }}</div>
                    <div class="doc-meta">
                      <h3>Dr. {{ doc.name }}</h3>
                      <span class="spec-tag">{{ doc.specialite || 'Généraliste' }}</span>
                    </div>
                  </div>
                  <div class="doc-body">
                    <div class="rating-box-comp">
                      <app-doctor-rating [rating]="doc.rating || 4.5" [totalReviews]="doc.totalReviews || 12" displayMode="display"></app-doctor-rating>
                    </div>
                    <p class="doc-address">📍 {{ doc.address || 'Hôpital Central' }}</p>
                  </div>
                  <button class="book-mini-btn" (click)="openBookingModal(doc)">Prendre RDV</button>
                </div>
              }
              @if (filteredDoctors().length === 0 && !loading()) {
                <div class="empty-state">
                  <span class="icon">🔍</span>
                  <p>Aucun médecin trouvé pour "{{ doctorSearchQuery() }}"</p>
                </div>
              }
            </div>
          </div>

          <!-- APPOINTMENTS TAB -->
          <div *ngSwitchCase="'appointments'" class="appointments-view" @fadeIn>
            <div class="section-card">
              <h2>📅 Mes Rendez-vous</h2>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Docteur</th>
                      <th>Date & Heure</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (apt of patientAppointments(); track apt.id) {
                      <tr>
                        <td>{{ apt.doctorName }}</td>
                        <td>{{ apt.dateTime | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                          <span class="status-badge" 
                                [class.active]="apt.status === 'confirme'"
                                [style.background]="apt.status === 'annule' ? '#fee2e2' : ''"
                                [style.color]="apt.status === 'annule' ? '#991b1b' : ''">
                            {{ apt.status }}
                          </span>
                        </td>
                        <td>
                          <button class="btn-action cancel" 
                                  *ngIf="apt.status === 'en_attente'" 
                                  (click)="cancelAppointment(apt.id)">
                            Annuler
                          </button>
                        </td>
                      </tr>
                    }
                    @if (patientAppointments().length === 0) {
                      <tr>
                        <td colspan="4" style="text-align: center; padding: 2rem;">Vous n'avez pas encore de rendez-vous.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- PHARMACIES TAB -->
          <div *ngSwitchCase="'pharmacies'" class="pharmacy-view" @fadeIn>
            <div class="section-card no-padding">
              <app-pharmacy-search></app-pharmacy-search>
            </div>
          </div>

          <!-- PROFILE TAB -->
          <div *ngSwitchCase="'profile'" class="profile-view" @fadeIn>
            <div class="section-card">
              <h2>👤 Mes Informations</h2>
              <div class="profile-details">
                <div class="detail-item">
                  <label>Nom Complet</label>
                  <p>{{ user()?.name }}</p>
                </div>
                <div class="detail-item">
                  <label>Email Gmail</label>
                  <p>{{ user()?.email }}</p>
                </div>
                <div class="detail-item">
                  <label>Rôle</label>
                  <p class="role-badge">Patient</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Booking Modal -->
      <div class="modal-overlay" *ngIf="showBookingModal()" (click)="closeBookingModal()">
        <div class="booking-modal" (click)="$event.stopPropagation()" @fadeIn>
          <div class="modal-header">
            <h2>Prendre Rendez-vous</h2>
            <button class="close-btn" (click)="closeBookingModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="doctor-summary" *ngIf="selectedDoctor()">
              <div class="doc-avatar">{{ selectedDoctor()?.name?.charAt(0) }}</div>
              <div>
                <h3>Dr. {{ selectedDoctor()?.name }}</h3>
                <p>{{ selectedDoctor()?.specialite }}</p>
              </div>
            </div>
            
            <form class="booking-form">
              <div class="form-group">
                <label>Date</label>
                <input type="date" [(ngModel)]="bookingDate" name="date" class="form-input">
              </div>
              <div class="form-group">
                <label>Heure</label>
                <input type="time" [(ngModel)]="bookingTime" name="time" class="form-input">
              </div>
              <div class="form-group">
                <label>Motif de consultation</label>
                <textarea [(ngModel)]="bookingReason" name="reason" placeholder="Ex: Consultation annuelle, Douleur..." class="form-input"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeBookingModal()">Annuler</button>
            <button class="btn-primary" [disabled]="!bookingDate || !bookingTime" (click)="confirmBooking()">Confirmer le Rendez-vous</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { --primary: #0d9488; --primary-light: #2dd4bf; --bg: #f8fafc; --sidebar: #ffffff; --text-main: #1e293b; --text-sub: #64748b; }
    
    .patient-dashboard { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; position: relative; overflow: hidden; }
    .glass-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(45, 212, 191, 0.05) 0%, rgba(13, 148, 136, 0.05) 100%); z-index: 0; pointer-events: none; }

    /* Sidebar Styles */
    .sidebar { width: 280px; background: var(--sidebar); border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; z-index: 10; padding: 2rem 1.5rem; }
    .sidebar-header { margin-bottom: 3rem; }
    .logo { display: flex; align-items: center; gap: 0.75rem; }
    .logo-icon { font-size: 2rem; }
    .logo h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }

    .nav-links { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .nav-links button { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border: none; background: transparent; color: var(--text-sub); font-weight: 600; cursor: pointer; border-radius: 12px; transition: all 0.2s; text-align: left; }
    .nav-links button:hover { background: #f1f5f9; color: var(--primary); }
    .nav-links button.active { background: rgba(13, 148, 136, 0.08); color: var(--primary); }
    .nav-links .icon { font-size: 1.2rem; }

    .logout-btn { display: flex; align-items: center; gap: 1rem; width: 100%; padding: 1rem; border: none; background: #fef2f2; color: #dc2626; font-weight: 700; border-radius: 12px; cursor: pointer; transition: 0.2s; }
    .logout-btn:hover { background: #fee2e2; transform: translateY(-2px); }

    /* Content Area */
    .main-content { flex: 1; position: relative; z-index: 1; padding: 2rem 3rem; overflow-y: auto; max-height: 100vh; }
    .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    .user-info h1 { margin: 0; font-size: 2rem; font-weight: 800; color: var(--text-main); }
    .user-info p { margin: 0.25rem 0 0; color: var(--text-sub); }
    
    .header-actions { display: flex; align-items: center; gap: 1.5rem; }
    .notif-badge { position: relative; font-size: 1.5rem; cursor: pointer; color: var(--text-sub); }
    .notif-badge .count { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; font-weight: 800; }
    .user-avatar { width: 45px; height: 45px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

    /* Overview Styles */
    .overview-grid { display: grid; gap: 2rem; }
    .hero-card { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, var(--primary) 0%, #065f46 100%); padding: 3rem; border-radius: 30px; color: white; position: relative; overflow: hidden; box-shadow: 0 20px 40px rgba(13, 148, 136, 0.2); }
    .hero-text h2 { font-size: 2.5rem; margin: 0 0 1rem; font-weight: 800; }
    .hero-text p { font-size: 1.1rem; opacity: 0.9; max-width: 400px; margin-bottom: 2rem; }
    .cta-btn { background: white; color: var(--primary); border: none; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s; }
    .cta-btn:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    .hero-img { font-size: 8rem; opacity: 0.2; transform: rotate(15deg); }

    .quick-stats { display: flex; gap: 1.5rem; }
    .stat-card { flex: 1; background: white; padding: 1.5rem; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1.25rem; }
    .stat-icon { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .stat-icon.calendar { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .stat-icon.heart { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .stat-info h3 { margin: 0; font-size: 0.9rem; color: var(--text-sub); }
    .stat-info p { margin: 0; font-weight: 800; color: var(--text-main); font-size: 1.1rem; }

    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .action-card { background: white; padding: 2rem; border-radius: 24px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .action-card:hover { transform: translateY(-8px); border-color: var(--primary); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.05); }
    .action-icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
    .action-card h3 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; }
    .action-card p { margin: 0; color: var(--text-sub); font-size: 0.95rem; }

    .section-card { background: white; padding: 2rem; border-radius: 24px; border: 1px solid #e2e8f0; margin-bottom: 2rem; }
    .section-card.no-padding { padding: 0; overflow: hidden; }
    .section-card h2 { margin-bottom: 2rem; font-weight: 800; }

    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-state .icon { font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state p { color: var(--text-sub); margin-bottom: 2rem; }

    /* Doctor Grid Styles */
    .search-bar-inline { display: flex; gap: 1rem; margin-bottom: 2rem; background: white; padding: 0.5rem; border-radius: 15px; border: 1px solid #e2e8f0; }
    .search-bar-inline input { flex: 1; border: none; padding: 0.8rem 1rem; font-size: 1rem; outline: none; }
    .filter-btn { background: var(--primary); color: white; border: none; padding: 0.8rem 1.2rem; border-radius: 10px; cursor: pointer; }

    .doctors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .doctor-card { background: white; border-radius: 20px; padding: 1.5rem; border: 1px solid #e2e8f0; transition: 0.3s; display: flex; flex-direction: column; gap: 1rem; }
    .doctor-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: var(--primary-light); }
    .doc-header { display: flex; gap: 1rem; align-items: center; }
    .doc-avatar { width: 60px; height: 60px; background: #f1f5f9; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: var(--primary); }
    .doc-meta h3 { margin: 0; font-size: 1.1rem; }
    .spec-tag { font-size: 0.8rem; background: #f0fdfa; color: #0d9488; padding: 2px 8px; border-radius: 5px; font-weight: 600; }
    .doc-body { flex: 1; }
    .doc-address { font-size: 0.85rem; color: var(--text-sub); margin: 0; }
    .book-mini-btn { width: 100%; padding: 0.8rem; border: 1.5px solid var(--primary); background: transparent; color: var(--primary); border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .book-mini-btn:hover { background: var(--primary); color: white; }

    /* Modal Styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .booking-modal { background: white; border-radius: 30px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--text-sub); }
    
    .modal-body { padding: 2rem; }
    .doctor-summary { display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem; background: #f8fafc; padding: 1rem; border-radius: 20px; }
    .doctor-summary h3 { margin: 0; font-size: 1.1rem; }
    .doctor-summary p { margin: 0; color: var(--text-sub); font-size: 0.9rem; }
    
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
    .form-input { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 1rem; transition: 0.2s; }
    .form-input:focus { outline: none; border-color: var(--primary); background: #f0fdfa; }
    textarea.form-input { min-height: 100px; resize: none; }
    
    .modal-footer { padding: 1.5rem 2rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-primary { background: var(--primary); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.3); }
    .btn-secondary { background: white; color: var(--text-main); border: 1.5px solid #e2e8f0; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 800; cursor: pointer; }

    /* Tables */
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
    th { text-align: left; padding: 1.2rem; color: var(--text-sub); font-size: 0.95rem; font-weight: 700; border-bottom: 2px solid #f1f5f9; }
    td { padding: 1.2rem; background: rgba(255,255,255,0.4); border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    td:first-child { border-left: 1px solid #e2e8f0; border-radius: 12px 0 0 12px; }
    td:last-child { border-right: 1px solid #e2e8f0; border-radius: 0 12px 12px 0; }
    .status-badge { padding: 6px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 800; background: #f1f5f9; color: #475569; }
    .status-badge.active { background: #f0fdf4; color: #166534; }
    .btn-action.cancel { color: #dc2626; border: 1.5px solid #fecaca; background: white; padding: 6px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }

    .profile-details { display: grid; gap: 1.5rem; }
    .detail-item label { display: block; font-size: 0.85rem; color: var(--text-sub); margin-bottom: 0.25rem; font-weight: 600; }
    .detail-item p { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); }
    .role-badge { display: inline-block; background: #e0f2f1; color: #00796b; padding: 4px 12px; border-radius: 8px; font-size: 0.85rem !important; }

    @media (max-width: 1024px) {
      .sidebar { width: 80px; padding: 2rem 0.5rem; }
      .logo h2, .nav-links button span:last-child, .sidebar-footer button span:last-child { display: none; }
      .nav-links button { justify-content: center; padding: 1rem; }
      .main-content { padding: 2rem; }
    }
  `,
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  user = signal<UserResponse | null>(null);
  activeTab = signal<ActiveTab>('overview');
  doctors = signal<DoctorResponse[]>([]);
  doctorSearchQuery = signal('');

  filteredDoctors = computed(() => {
    const q = this.doctorSearchQuery().toLowerCase();
    return this.doctors().filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.specialite && d.specialite.toLowerCase().includes(q))
    );
  });

  patientAppointments = signal<any[]>([]);
  nextAppointment = signal<any | null>(null);
  loading = signal(false);

  // Booking Modal State
  showBookingModal = signal(false);
  selectedDoctor = signal<DoctorResponse | null>(null);
  bookingDate = '';
  bookingTime = '';
  bookingReason = '';

  constructor(private router: Router, private api: ApiService) { }

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      this.user.set(userData);
      this.loadDoctors();
      this.loadPatientAppointments(userData.id);
    } else {
      this.router.navigate(['/auth']);
    }
  }

  loadPatientAppointments(patientId: number) {
    this.api.getAppointmentsByPatient(patientId).subscribe({
      next: (res: any[]) => {
        this.patientAppointments.set(res);
        // Find next upcoming appointment
        const now = new Date();
        const upcoming = res
          .filter(a => new Date(a.dateTime) > now && a.status !== 'annule')
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        this.nextAppointment.set(upcoming.length > 0 ? upcoming[0] : null);
      },
      error: (err) => console.error('Error loading patient appointments:', err)
    });
  }

  cancelAppointment(appointmentId: number) {
    if (!confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) return;

    this.api.cancelAppointment(appointmentId).subscribe({
      next: () => {
        alert('Rendez-vous annulé avec succès');
        if (this.user()) {
          this.loadPatientAppointments(this.user()!.id);
        }
      },
      error: (err) => alert('Erreur lors de l\'annulation : ' + err.message)
    });
  }

  loadDoctors() {
    this.loading.set(true);
    this.api.getDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openBookingModal(doctor: DoctorResponse) {
    this.selectedDoctor.set(doctor);
    this.showBookingModal.set(true);
  }

  closeBookingModal() {
    this.showBookingModal.set(false);
    this.selectedDoctor.set(null);
    this.bookingDate = '';
    this.bookingTime = '';
    this.bookingReason = '';
  }

  confirmBooking() {
    if (!this.user() || !this.selectedDoctor()) return;

    const bookingData = {
      doctorId: this.selectedDoctor()!.id,
      dateTime: `${this.bookingDate}T${this.bookingTime}:00`,
      duration: 30, // Default duration
      reason: this.bookingReason
    };

    this.api.createAppointment(bookingData).subscribe({
      next: () => {
        alert('Rendez-vous demandé avec succès !');
        this.closeBookingModal();
        this.loadPatientAppointments(this.user()!.id);
        this.activeTab.set('appointments');
      },
      error: (err) => alert('Erreur lors de la prise de rendez-vous : ' + err.message)
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth']);
  }

  ngOnDestroy() { }
}
