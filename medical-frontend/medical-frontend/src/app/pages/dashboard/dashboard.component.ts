import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, computed } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, PendingRequest } from '../../core/services/admin.service';

import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  providers: [DatePipe],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="dashboard-container">
      <!-- Particle Background -->
      <canvas #bgCanvas id="bg-canvas"></canvas>

      <header class="dashboard-nav">
        <div class="nav-content">
          <div class="logo">
            <span class="icon">🏥</span>
            <div class="text">
              <h1>Mediconnect Pro</h1>
              <span class="tagline">Administration Panel</span>
            </div>
          </div>
          <div class="nav-actions">
            <span class="admin-badge">Admin</span>
            <button (click)="logout()" class="btn-logout" title="Déconnexion">
              <span>Quitter</span>
              <span class="logout-icon">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main class="dashboard-main">
        <!-- HUB VIEW -->
        @if (activeView() === 'hub') {
          <div class="hub-container" @fadeInOut>
            <div class="hub-header">
              <h2>Centre de Contrôle Administrateur</h2>
              <p>Supervisez les inscriptions et gérez les comptes professionnels.</p>
            </div>

            <div class="dashboard-stats">
              <div class="stat-card" [routerLink]="[]" [queryParams]="{view: 'approvals', filter: 'doctor'}">
                <div class="stat-icon med">👨‍⚕️</div>
                <div class="stat-info">
                  <h3>Pending Doctors</h3>
                  <div class="stat-value">{{ pendingDoctorCount() }}</div>
                </div>
                <canvas class="circle-particles" #medParticles></canvas>
              </div>

              <div class="stat-card" [routerLink]="[]" [queryParams]="{view: 'approvals', filter: 'pharmacist'}">
                <div class="stat-icon phar">💊</div>
                <div class="stat-info">
                  <h3>Pending Pharmacists</h3>
                  <div class="stat-value">{{ pendingPharmacistCount() }}</div>
                </div>
                <canvas class="circle-particles" #phParticles></canvas>
              </div>

              <div class="stat-card pulse" [routerLink]="[]" [queryParams]="{view: 'approvals', filter: 'all'}">
                <div class="stat-icon total">📋</div>
                <div class="stat-info">
                  <h3>Total Pending</h3>
                  <div class="stat-value">{{ requests().length }}</div>
                </div>
                <canvas class="circle-particles" #accParticles></canvas>
              </div>
            </div>

            <!-- Removed Gérer les Approbations button as cards are now primary navigation -->
          </div>
        }

        <!-- APPROVALS VIEW -->
        @if (activeView() === 'approvals') {
          <div class="management-view" @fadeInOut>
            <div class="management-header">
              <button class="btn-back" (click)="switchView('hub')">← Retour au Hub</button>
              <h2>Approbation des Inscriptions</h2>
            </div>

            <div class="table-actions">
              <div class="filter-tabs">
                <button [class.active]="filter() === 'all'" (click)="filter.set('all')">
                  Tous <span class="count-pill">{{ requests().length }}</span>
                </button>
                <button [class.active]="filter() === 'DOCTOR'" (click)="filter.set('DOCTOR')">
                  Médecins <span class="count-pill">{{ pendingDoctorCount() }}</span>
                </button>
                <button [class.active]="filter() === 'PHARMACIST'" (click)="filter.set('PHARMACIST')">
                  Pharmaciens <span class="count-pill">{{ pendingPharmacistCount() }}</span>
                </button>
              </div>
            </div>

            <div class="table-card">
              @if (loading()) {
                <div class="loader">
                  <div class="spinner"></div>
                  <p>Chargement des demandes...</p>
                </div>
              } @else if (filteredRequests().length === 0) {
                <div class="empty-msg">
                  <div class="empty-icon">🎉</div>
                  <p>Aucune demande en attente pour cette catégorie !</p>
                </div>
              } @else {
                <div class="table-container">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Candidat</th>
                        <th>Contact</th>
                        <th>Rôle</th>
                        <th>Licence / Spéc.</th>
                        <th>Date de Soumission</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (req of filteredRequests(); track req.userId) {
                        <tr>
                          <td>
                            <div class="user-cell">
                              <span class="user-avatar">{{ req.fullName.charAt(0) }}</span>
                              <span class="user-name">{{ req.fullName }}</span>
                            </div>
                          </td>
                          <td>
                            <div class="email-cell">{{ req.email }}</div>
                          </td>
                          <td>
                            <span class="badge" [class]="req.role.toLowerCase()">{{ req.role }}</span>
                          </td>
                          <td>
                            <div class="license-info">
                              <span class="license-num">{{ req.licenseNumber }}</span>
                              @if (req.role === 'PHARMACIST') {
                                <span class="spec-tag pharmacy">🏪 {{ req.pharmacyName || '-' }}</span>
                              } @else {
                                <span class="spec-tag">{{ req.specialization || '-' }}</span>
                              }
                            </div>
                          </td>
                          <td>{{ req.submissionDate | date:'mediumDate' }}</td>
                          <td class="actions-cell">
                            <button class="btn-approve" (click)="approveUser(req)">Approuver</button>
                            <button class="btn-reject" (click)="openRejectModal(req)">Rejeter</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        }
      </main>

      <!-- REJECT MODAL -->
      @if (showRejectModal()) {
        <div class="modal-backdrop" @fadeInOut (click)="closeRejectModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Motif du Rejet</h3>
              <button class="close-btn" (click)="closeRejectModal()">×</button>
            </div>
            <div class="modal-body">
              <p>Indiquez la raison du rejet pour <strong>{{ selectedRequest()?.fullName }}</strong>.</p>
              <textarea 
                [(ngModel)]="rejectionReason" 
                rows="4" 
                placeholder="Ex: Document de licence non valide ou expiré..."
              ></textarea>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeRejectModal()">Annuler</button>
              <button 
                class="btn-danger" 
                [disabled]="!rejectionReason.trim() || processing()"
                (click)="confirmReject()"
              >
                @if (processing()) { Processing... } @else { Confirmer le Rejet }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TOAST NOTIFICATIONS -->
      <div class="toast-container">
        @for (toast of toasts(); track toast.id) {
          <div class="toast" [class]="toast.type" @fadeInOut>
            <span class="toast-icon">
              {{ toast.type === 'success' ? '✅' : '❌' }}
            </span>
            <span class="toast-message">{{ toast.message }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { --primary: #2dd4bf; --danger: #ef4444; --bg-dark: #0f172a; --card-bg: rgba(30, 41, 59, 0.7); }
    .dashboard-container { min-height: 100vh; background: var(--bg-dark); color: white; font-family: 'Inter', sans-serif; position: relative; overflow-x: hidden; }
    #bg-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
    
    /* Header */
    .dashboard-nav { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); padding: 1rem 2rem; border-bottom: 1px solid rgba(45, 212, 191, 0.2); position: sticky; top: 0; z-index: 100; }
    .nav-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
    .logo { display: flex; align-items: center; gap: 0.75rem; }
    .logo h1 { font-size: 1.5rem; margin: 0; background: linear-gradient(45deg, #2dd4bf, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
    .tagline { font-size: 0.75rem; color: #94a3b8; display: block; }
    .nav-actions { display: flex; align-items: center; gap: 1rem; }
    .admin-badge { background: rgba(45, 212, 191, 0.1); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(45, 212, 191, 0.3); }
    .btn-logout { background: transparent; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-weight: 600; }
    .btn-logout:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; transform: translateY(-1px); }

    /* Main Content */
    .dashboard-main { position: relative; z-index: 1; padding: 2.5rem 2rem; max-width: 1400px; margin: 0 auto; }
    .hub-header { text-align: center; margin-bottom: 3.5rem; }
    .hub-header h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
    .hub-header p { color: #94a3b8; font-size: 1.1rem; }

    /* Stats Grid */
    .dashboard-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-bottom: 3rem; }
    .stat-card { background: var(--card-bg); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 2rem; display: flex; align-items: center; gap: 1.5rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; backdrop-filter: blur(12px); }
    .stat-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 10px 30px -10px rgba(45, 212, 191, 0.2); }
    .stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; background: rgba(15, 23, 42, 0.5); }
    .stat-icon.med { color: #2dd4bf; border: 1px solid rgba(45, 212, 191, 0.2); }
    .stat-icon.phar { color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.2); }
    .stat-icon.total { color: #818cf8; border: 1px solid rgba(129, 140, 248, 0.2); }
    .stat-info h3 { font-size: 0.9rem; color: #94a3b8; margin: 0; font-weight: 600; }
    .stat-value { font-size: 2rem; font-weight: 800; margin-top: 0.25rem; }
    .circle-particles { position: absolute; inset: 0; opacity: 0.4; pointer-events: none; }

    /* Table & Management */
    .management-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
    
    .table-actions { margin-bottom: 1.5rem; }
    .filter-tabs { display: flex; gap: 1rem; background: rgba(15, 23, 42, 0.4); padding: 0.5rem; border-radius: 12px; width: fit-content; border: 1px solid rgba(255,255,255,0.05); }
    .filter-tabs button { background: transparent; border: none; color: #94a3b8; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.75rem; }
    .filter-tabs button:hover { color: white; background: rgba(255,255,255,0.05); }
    .filter-tabs button.active { background: var(--primary); color: #0f172a; box-shadow: 0 4px 12px rgba(45, 212, 191, 0.2); }
    .count-pill { background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .filter-tabs button.active .count-pill { background: rgba(15, 23, 42, 0.2); color: #0f172a; }

    .btn-back { background: rgba(255,255,255,0.05); border: none; color: #94a3b8; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: 600; }
    .btn-back:hover { background: rgba(255,255,255,0.1); color: white; }
    .table-card { background: var(--card-bg); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; backdrop-filter: blur(12px); }
    .table-container { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
    .admin-table th { padding: 1rem; color: #64748b; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .admin-table td { padding: 1.25rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.02); vertical-align: middle; }
    .admin-table tr:hover { background: rgba(255,255,255,0.02); }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #818cf8); display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; }
    .user-name { font-weight: 600; color: #f8fafc; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .badge.doctor { background: rgba(45, 212, 191, 0.1); color: var(--primary); }
    .badge.pharmacist { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
    .license-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .license-num { font-family: monospace; font-weight: 600; color: #cbd5e1; }
    .spec-tag { font-size: 0.75rem; color: #64748b; }
    .spec-tag.pharmacy { color: #fbbf24; font-weight: 500; }

    .actions-cell { display: flex; gap: 0.75rem; }
    .btn-approve { background: var(--primary); color: #0f172a; border: none; padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-approve:hover { filter: brightness(1.1); transform: scale(1.05); }
    .btn-reject { background: transparent; color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-reject:hover { background: rgba(239, 68, 68, 0.1); border-color: var(--danger); }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-content { background: #1e293b; width: 100%; max-width: 500px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .modal-header { padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .modal-header h3 { margin: 0; font-size: 1.25rem; }
    .close-btn { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .modal-body textarea { width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; padding: 1rem; resize: none; margin-top: 1rem; outline: none; }
    .modal-body textarea:focus { border-color: var(--primary); }
    .modal-footer { padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; background: rgba(15, 23, 42, 0.3); }
    .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-danger { background: var(--danger); border: none; color: white; padding: 0.5rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Toast */
    .toast-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 2000; display: flex; flex-direction: column; gap: 1rem; }
    .toast { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid var(--primary); padding: 1rem 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; min-width: 300px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .toast.error { border-left-color: var(--danger); }
    .toast-icon { font-size: 1.25rem; }

    /* Utils */
    .loader { padding: 4rem; text-align: center; color: var(--primary); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(45, 212, 191, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    .empty-msg { padding: 4rem; text-align: center; color: #64748b; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(129, 140, 248, 0); } 100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); } }
    .stat-card.pulse { animation: pulse-ring 2s infinite; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') bgCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('medParticles') medParticles!: ElementRef<HTMLCanvasElement>;
  @ViewChild('phParticles') phParticles!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accParticles') accParticles!: ElementRef<HTMLCanvasElement>;

  // Signals
  activeView = signal<'hub' | 'approvals'>('hub');
  requests = signal<PendingRequest[]>([]);
  filter = signal<'all' | 'DOCTOR' | 'PHARMACIST'>('all');
  loading = signal(false);
  processing = signal(false);
  showRejectModal = signal(false);
  selectedRequest = signal<PendingRequest | null>(null);
  toasts = signal<any[]>([]);

  // Simple state for rejection form (can also use signal)
  rejectionReason = '';

  // Computed
  pendingDoctorCount = computed(() => this.requests().filter(r => r.role === 'DOCTOR').length);
  pendingPharmacistCount = computed(() => this.requests().filter(r => r.role === 'PHARMACIST').length);
  filteredRequests = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'all') return this.requests();
    return this.requests().filter(r => r.role === currentFilter);
  });

  private ctx!: CanvasRenderingContext2D;
  private animationId!: number;
  private particles: any[] = [];
  private circleContexts: { [key: string]: CanvasRenderingContext2D } = {};

  constructor(
    private adminService: AdminService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadRequests();
    this.syncRouteParams();
  }

  private syncRouteParams() {
    this.route.queryParams.subscribe(params => {
      const view = params['view'];
      const filter = params['filter'];

      if (view === 'approvals') {
        this.activeView.set('approvals');
      } else {
        this.activeView.set('hub');
      }

      if (filter === 'doctor') {
        this.filter.set('DOCTOR');
      } else if (filter === 'pharmacist') {
        this.filter.set('PHARMACIST');
      } else {
        this.filter.set('all');
      }
    });
  }

  ngAfterViewInit() {
    this.initMainCanvas();
    this.initCircleCanvases();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize);
  }

  loadRequests() {
    this.loading.set(true);
    this.adminService.getPendingRequests().subscribe({
      next: (data) => {
        console.log('ADM_DIAG: Pending requests received from service:', data);
        this.requests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.showToast(err.message, 'error');
      }
    });
  }

  switchView(view: 'hub' | 'approvals') {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: view === 'hub' ? null : 'approvals', filter: null },
      queryParamsHandling: 'merge'
    });

    if (view === 'hub') {
      setTimeout(() => this.initCircleCanvases(), 0);
    }
  }

  approveUser(req: PendingRequest) {
    if (this.processing()) return;
    this.processing.set(true);
    this.adminService.approveUser(req.userId).subscribe({
      next: () => {
        this.showToast(`Candidature de ${req.fullName} approuvée !`, 'success');
        this.requests.update(list => list.filter(r => r.userId !== req.userId));
        this.processing.set(false);
      },
      error: (err) => {
        this.showToast(err.message, 'error');
        this.processing.set(false);
      }
    });
  }

  openRejectModal(req: PendingRequest) {
    this.selectedRequest.set(req);
    this.rejectionReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedRequest.set(null);
  }

  confirmReject() {
    const req = this.selectedRequest();
    if (!req || !this.rejectionReason.trim() || this.processing()) return;

    this.processing.set(true);
    this.adminService.rejectUser(req.userId, this.rejectionReason).subscribe({
      next: () => {
        this.showToast(`Candidature de ${req.fullName} rejetée.`, 'success');
        this.requests.update(list => list.filter(r => r.userId !== req.userId));
        this.processing.set(false);
        this.closeRejectModal();
      },
      error: (err) => {
        this.showToast(err.message, 'error');
        this.processing.set(false);
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth']);
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    this.toasts.update(current => [...current, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 4000);
  }

  // Animation & Canvas Logic
  initMainCanvas() {
    const canvas = this.bgCanvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.onResize();
    window.addEventListener('resize', this.onResize);
    
    // Create background stars
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: 0.1 + Math.random() * 0.2
      });
    }
  }

  initCircleCanvases() {
    if (this.medParticles) this.circleContexts['med'] = this.medParticles.nativeElement.getContext('2d')!;
    if (this.phParticles) this.circleContexts['ph'] = this.phParticles.nativeElement.getContext('2d')!;
    if (this.accParticles) this.circleContexts['acc'] = this.accParticles.nativeElement.getContext('2d')!;
    
    Object.values(this.circleContexts).forEach(ctx => {
      ctx.canvas.width = 300;
      ctx.canvas.height = 300;
    });
  }

  onResize = () => {
    const canvas = this.bgCanvas.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.bgCanvas.nativeElement.width, this.bgCanvas.nativeElement.height);
    this.ctx.fillStyle = 'white';
    
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      p.y -= p.speed;
      if (p.y < 0) p.y = this.bgCanvas.nativeElement.height;
    });

    // Animate circle canvases if they exist
    Object.keys(this.circleContexts).forEach(key => {
      const ctx = this.circleContexts[key];
      if (!ctx) return;
      ctx.clearRect(0, 0, 300, 300);
      const time = Date.now() * 0.002;
      ctx.strokeStyle = key === 'med' ? '#2dd4bf' : (key === 'ph' ? '#fbbf24' : '#818cf8');
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      
      for(let i=0; i<3; i++) {
        ctx.beginPath();
        const r = 100 + Math.sin(time + i) * 20;
        ctx.arc(150, 150, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}
