import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrescriptionService, Prescription } from '../../../core/services/prescription.service';

@Component({
    selector: 'app-prescriptions-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="prescriptions-container">
      <header class="page-header">
        <div class="header-left">
          <h2>📋 Gestion des Prescriptions</h2>
          <p>Consultez et délivrez les ordonnances médicales de vos patients.</p>
        </div>
      </header>

      <!-- Tabs -->
      <nav class="tab-nav">
        <button [class.active]="activeTab() === 'PENDING'" (click)="setTab('PENDING')">
          A Délivrer
          <span class="count">{{ pendingCount() }}</span>
        </button>
        <button [class.active]="activeTab() === 'FULFILLED'" (click)="setTab('FULFILLED')">
          Historique
          <span class="count">{{ fulfilledCount() }}</span>
        </button>
        <button [class.active]="activeTab() === 'ALL'" (click)="setTab('ALL')">Toutes</button>
      </nav>

      <!-- Search & Utils -->
      <section class="utils-bar">
        <div class="search-box">
          <span class="icon">🔍</span>
          <input type="text" placeholder="Rechercher par patient, docteur..." 
                 [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)">
        </div>
        <div class="date-filter">
          <input type="date" [(ngModel)]="dateFilter">
        </div>
      </section>

      <!-- Prescriptions Table -->
      <div class="table-card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                 <th>Patient</th>
                 <th>Docteur</th>
                 <th>Date</th>
                 <th>Médicaments</th>
                 <th>Statut</th>
                 <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (pres of filteredPrescriptions(); track pres.id) {
                <tr>
                   <td>
                     <div class="user-info">
                       <strong>{{ pres.patientName }}</strong>
                     </div>
                   </td>
                   <td>Dr. {{ pres.doctorName }}</td>
                   <td>{{ pres.date | date:'dd/MM/yyyy HH:mm' }}</td>
                   <td>{{ pres.medicinesSummary }}</td>
                   <td>
                     <span class="status-badge" [ngClass]="pres.status.toLowerCase()">
                       {{ getStatusText(pres.status) }}
                     </span>
                   </td>
                   <td>
                      <div class="btn-group">
                        <button class="btn-primary" [routerLink]="['/pharmacist/prescriptions', pres.id]">Détails</button>
                        @if (pres.status === 'PENDING') {
                          <button class="btn-success" [routerLink]="['/pharmacist/prescriptions', pres.id]" [queryParams]="{action: 'fulfill'}">Servir</button>
                        }
                      </div>
                   </td>
                </tr>
              }
              @if (filteredPrescriptions().length === 0) {
                <tr>
                   <td colspan="6" class="empty-state">
                     Aucune prescription trouvée.
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styles: `
    .prescriptions-container { display: flex; flex-direction: column; gap: 2rem; }
    
    .page-header h2 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; }
    .page-header p { color: #64748b; margin: 0.25rem 0 0; }

    /* Tabs */
    .tab-nav { display: flex; gap: 1rem; border-bottom: 1px solid #e2e8f0; }
    .tab-nav button { 
      background: none; border: none; padding: 1rem 1.5rem; font-weight: 700; color: #64748b; 
      cursor: pointer; border-bottom: 3px solid transparent; display: flex; align-items: center; gap: 0.75rem;
    }
    .tab-nav button:hover { color: #1e293b; }
    .tab-nav button.active { color: #0891b2; border-bottom-color: #0891b2; }
    
    .count { 
      background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem;
    }
    .active .count { background: #0891b2; color: white; }

    /* Utils Bar */
    .utils-bar { display: flex; justify-content: space-between; gap: 1rem; }
    .search-box { 
      flex: 1; display: flex; align-items: center; gap: 0.75rem; background: white;
      padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
    }
    .search-box input { border: none; width: 100%; outline: none; font-family: inherit; }
    .date-filter input { 
      padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; font-family: inherit;
    }

    /* Table */
    .table-card { background: white; border-radius: 25px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1.25rem; background: #f8fafc; color: #64748b; font-size: 0.85rem; font-weight: 700; border-bottom: 2px solid #f1f5f9; }
    td { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; }
    
    .status-badge { padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; display: inline-block; }
    .status-badge.pending { background: #fffbeb; color: #b45309; }
    .status-badge.fulfilled { background: #dcfce7; color: #166534; }
    .status-badge.cancelled { background: #fef2f2; color: #991b1b; }

    .btn-group { display: flex; gap: 0.5rem; }
    .btn-primary { background: #0891b2; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; font-size: 0.85rem; }
    .btn-success { background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; font-size: 0.85rem; }

    .empty-state { text-align: center; padding: 4rem !important; color: #94a3b8; font-style: italic; }

    @media (max-width: 768px) {
      .utils-bar { flex-direction: column; }
    }
  `
})
export class PrescriptionsListComponent implements OnInit {
    prescriptions = signal<Prescription[]>([]);
    activeTab = signal<'PENDING' | 'FULFILLED' | 'ALL'>('PENDING');
    searchQuery = signal('');
    dateFilter = '';

    constructor(private prescriptionService: PrescriptionService) { }

    ngOnInit() {
        this.loadPrescriptions();
    }

    loadPrescriptions() {
        this.prescriptionService.getPendingPrescriptions().subscribe(data => {
            this.prescriptions.update(prev => [...prev.filter((p: Prescription) => p.status !== 'PENDING'), ...data]);
        });
        this.prescriptionService.getFulfilledPrescriptions().subscribe(data => {
            this.prescriptions.update(prev => [...prev.filter((p: Prescription) => p.status !== 'FULFILLED'), ...data]);
        });
    }

    filteredPrescriptions() {
        let result = this.prescriptions();

        if (this.activeTab() !== 'ALL') {
            result = result.filter((p: Prescription) => p.status === this.activeTab());
        }

        if (this.searchQuery()) {
            const q = this.searchQuery().toLowerCase();
            result = result.filter((p: Prescription) =>
                p.patientName.toLowerCase().includes(q) ||
                p.doctorName.toLowerCase().includes(q) ||
                p.medicinesSummary.toLowerCase().includes(q)
            );
        }

        if (this.dateFilter) {
            result = result.filter((p: Prescription) => p.date.startsWith(this.dateFilter));
        }

        return result.sort((a: Prescription, b: Prescription) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setTab(t: 'PENDING' | 'FULFILLED' | 'ALL') {
        this.activeTab.set(t);
    }

    pendingCount() { return this.prescriptions().filter((p: Prescription) => p.status === 'PENDING').length; }
    fulfilledCount() { return this.prescriptions().filter((p: Prescription) => p.status === 'FULFILLED').length; }

    getStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return 'A SERVIR';
            case 'FULFILLED': return 'SERVIE';
            case 'CANCELLED': return 'ANNULÉE';
            default: return status;
        }
    }
}
