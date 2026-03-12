import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PharmacistService, DashboardStats } from '../../../core/services/pharmacist.service';
import { StockService, MedicineStock } from '../../../core/services/stock.service';
import { PrescriptionService, Prescription } from '../../../core/services/prescription.service';

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Stats Cards -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon medicine-icon">💊</div>
          <div class="stat-info">
            <h3>Médicaments en Stock</h3>
            <p>{{ stats()?.totalMedicines || 0 }}</p>
          </div>
        </div>
        <div class="stat-card urgent">
          <div class="stat-icon low-stock-icon">⚠️</div>
          <div class="stat-info">
            <h3>Stock Faible (< 10)</h3>
            <p>{{ stats()?.lowStockCount || 0 }}</p>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon pending-icon">📋</div>
          <div class="stat-info">
            <h3>Prescriptions en attente</h3>
            <p>{{ stats()?.pendingPrescriptions || 0 }}</p>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon success-icon">✅</div>
          <div class="stat-info">
            <h3>Serties Aujourd'hui</h3>
            <p>{{ stats()?.fulfilledToday || 0 }}</p>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <button routerLink="/pharmacist/stock" [queryParams]="{action: 'add'}" class="btn-action primary">
          <span>➕</span> Nouveau Médicament
        </button>
        <button routerLink="/pharmacist/prescriptions" class="btn-action secondary">
          <span>📋</span> Voir les Prescriptions
        </button>
        <button routerLink="/pharmacist/stock" [queryParams]="{filter: 'low'}" class="btn-action warning">
          <span>⚠️</span> Vérifier Stock Faible
        </button>
      </section>

      <div class="dashboard-grid">
        <!-- Alerts Section -->
        <section class="dashboard-card alerts-section">
          <h2>Alertes & Notifications</h2>
          <div class="alert-list">
            @for (item of lowStockItems(); track item.id) {
              <div class="alert-item warning">
                <span class="icon">⚠️</span>
                <div class="alert-content">
                  <h4>{{ item.name }} - Stock Faible</h4>
                  <p>Quantité restante: {{ item.quantity }} units</p>
                </div>
                <button [routerLink]="['/pharmacist/stock']" [queryParams]="{id: item.id, action: 'edit'}" class="btn-small">Mettre à jour</button>
              </div>
            }
            @for (item of expiringItems(); track item.id) {
              <div class="alert-item danger">
                <span class="icon">⏰</span>
                <div class="alert-content">
                  <h4>{{ item.name }} - Expire Bientôt</h4>
                  <p>Date d'expiration: {{ item.expiryDate | date:'dd/MM/yyyy' }}</p>
                </div>
              </div>
            }
            @if (lowStockItems().length === 0 && expiringItems().length === 0) {
              <div class="empty-state">
                <p>Aucune alerte pour le moment.</p>
              </div>
            }
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="dashboard-card activity-section">
          <h2>Activité Récente</h2>
          <div class="activity-list">
            @for (pres of recentPrescriptions(); track pres.id) {
              <div class="activity-item">
                <div class="activity-date">{{ pres.date | date:'shortTime' }}</div>
                <div class="activity-content">
                  <p>Ordonnance délivrée à <strong>{{ pres.patientName }}</strong></p>
                  <span class="status-tag fulfilled">DELIVREE</span>
                </div>
              </div>
            }
             @if (recentPrescriptions().length === 0) {
              <div class="empty-state">
                <p>Aucune activité récente.</p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-card.urgent { border-left: 5px solid #ef4444; }
    .stat-card.pending { border-left: 5px solid #f59e0b; }
    .stat-card.success { border-left: 5px solid #10b981; }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      background: #f1f5f9;
    }

    .stat-info h3 {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-info p {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0.25rem 0 0;
      color: #1e293b;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .btn-action {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      border: none;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.95rem;
      text-decoration: none;
    }

    .btn-action.primary { background: #0891b2; color: white; }
    .btn-action.secondary { background: #f1f5f9; color: #1e293b; }
    .btn-action.warning { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }

    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    /* Dashboard Cards */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .dashboard-card {
      background: white;
      border-radius: 25px;
      padding: 2rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
    }

    .dashboard-card h2 {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 1.5rem;
      color: #1e293b;
    }

    /* Alerts */
    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 15px;
      background: #f8fafc;
    }

    .alert-item.warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
    .alert-item.danger { border-left: 4px solid #ef4444; background: #fef2f2; }

    .alert-content { flex: 1; }
    .alert-content h4 { margin: 0; font-size: 0.95rem; font-weight: 700; }
    .alert-content p { margin: 0; font-size: 0.85rem; color: #64748b; }

    .btn-small {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: white;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    /* Activity */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .activity-item {
      display: flex;
      gap: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .activity-date {
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 600;
      min-width: 60px;
    }

    .activity-content p {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
    }

    .status-tag {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .status-tag.fulfilled { background: #dcfce7; color: #166534; }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }
  `
})
export class PharmacistDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  lowStockItems = signal<MedicineStock[]>([]);
  expiringItems = signal<MedicineStock[]>([]);
  recentPrescriptions = signal<Prescription[]>([]);

  constructor(
    private pharmacistService: PharmacistService,
    private stockService: StockService,
    private prescriptionService: PrescriptionService
  ) { }

  ngOnInit() {
    this.loadStats();
    this.loadAlerts();
    this.loadRecentActivity();
  }

  loadStats() {
    this.pharmacistService.getDashboardStats().subscribe({
      next: (data: DashboardStats) => this.stats.set(data),
      error: (err: any) => console.error(err)
    });
  }


  loadAlerts() {
    this.stockService.getLowStock(10).subscribe(data => this.lowStockItems.set(data.slice(0, 5)));
    this.stockService.getExpiringMedicines(30).subscribe(data => this.expiringItems.set(data.slice(0, 5)));
  }

  loadRecentActivity() {
    this.prescriptionService.getFulfilledPrescriptions().subscribe(data => this.recentPrescriptions.set(data.slice(0, 5)));
  }
}
