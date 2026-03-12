import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrescriptionService, Prescription, FulfillRequest } from '../../../core/services/prescription.service';

@Component({
    selector: 'app-prescription-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="prescription-container" *ngIf="prescription()">
      <header class="page-header">
        <div class="header-left">
          <button class="btn-back" routerLink="/pharmacist/prescriptions">← Retour</button>
          <h2>Ordonnance #{{ prescription()?.id }}</h2>
        </div>
        <div class="header-actions">
           @if (prescription()?.status === 'PENDING') {
             <button class="btn-primary" (click)="openFulfillModal()">Servir l'Ordonnance</button>
           }
           <button class="btn-secondary" (click)="printPrescription()">Imprimer</button>
        </div>
      </header>

      <div class="layout-grid">
        <!-- Info Summary -->
        <section class="info-section">
          <div class="detail-card">
            <h3>🏛️ Information Générale</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Patient</span>
                <span class="value">{{ prescription()?.patientName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Docteur</span>
                <span class="value">Dr. {{ prescription()?.doctorName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Date d'émission</span>
                <span class="value">{{ prescription()?.date | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Statut</span>
                <span class="status-badge" [ngClass]="prescription()!.status.toLowerCase()">
                   {{ getStatusText(prescription()!.status) }}
                </span>
              </div>
               @if (prescription()?.fulfilledDate) {
                <div class="info-item">
                  <span class="label">Délivrée le</span>
                  <span class="value">{{ prescription()?.fulfilledDate | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Medicines List -->
           <div class="detail-card">
            <h3>💊 Médicaments Listés</h3>
            <div class="medicines-table">
              <table>
                <thead>
                  <tr>
                    <th>Médicament</th>
                    <th>Instructions / Posologie</th>
                    <th>Vérifier Stock</th>
                  </tr>
                </thead>
                <tbody>
                  @for (med of prescription()!.medicines; track med.id) {
                    <tr>
                      <td>
                         <strong>{{ med.name }}</strong><br>
                         <span class="med-details">{{ med.dosage }} - {{ med.form }}</span>
                      </td>
                      <td class="posologie">{{ med.instructions || 'Selon posologie standard' }}</td>
                      <td>
                         <span class="stock-check" [class.ok]="med.inStock">
                           {{ med.inStock ? 'En Stock ✅' : 'En Rupture ❌' }}
                         </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
           </div>
        </section>

        <!-- Sidebar / Notes -->
        <aside class="side-section">
           <div class="detail-card">
              <h3>📝 Instructions du Docteur</h3>
              <div class="instructions-content">
                <p>{{ prescription()?.instructions || 'Aucune instruction supplémentaire fournie.' }}</p>
              </div>
           </div>
           
           @if (prescription()?.status === 'FULFILLED') {
             <div class="detail-card success">
                <h3>✅ Note de Délivrance</h3>
                <div class="notes-content">
                   <p>Délivrance effectuée par le pharmacien.</p>
                </div>
             </div>
           }
        </aside>
      </div>

       <!-- Fulfill Modal -->
      <div class="modal-overlay" *ngIf="showFulfillModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Délivrance de l'Ordonnance</h2>
            <button class="close-btn" (click)="showFulfillModal.set(false)">✕</button>
          </div>
          <form [formGroup]="fulfillForm" (ngSubmit)="onFulfill()">
            <div class="form-body">
              <p>Confirmez que vous avez vérifié l'identité du patient et la disponibilité des médicaments.</p>
              <div class="form-group">
                <label>Notes de vérification (optionnel)</label>
                <textarea formControlName="verificationNotes" class="form-control" rows="3" placeholder="Notes sur les doses délivrées, substituts..."></textarea>
              </div>
              <div class="form-group checkbox-group">
                 <label class="checkbox-container">
                    Marquer comme délivrée partiellement
                    <input type="checkbox" formControlName="markAsPartiallyFulfilled">
                    <span class="checkmark"></span>
                  </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="showFulfillModal.set(false)">Annuler</button>
              <button type="submit" class="btn-save" [disabled]="fulfillForm.invalid || isProcessing()">
                {{ isProcessing() ? 'Traitement...' : 'Confirmer la Délivrance' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: `
    .prescription-container { display: flex; flex-direction: column; gap: 2rem; }
    
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 1.5rem; }
    .btn-back { background: none; border: none; font-weight: 700; color: #0891b2; cursor: pointer; padding: 0.5rem; }
    .page-header h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
    
    .header-actions { display: flex; gap: 1rem; }
    .btn-primary { background: #0891b2; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
    .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; }

    .layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    
    .detail-card { background: white; border-radius: 25px; border: 1px solid #e2e8f0; padding: 2rem; margin-bottom: 2rem; }
    .detail-card.success { background: #f0fdf4; border-color: #dcfce7; }
    .detail-card h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-top: 0; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-item .label { font-size: 0.8rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .info-item .value { font-size: 1rem; font-weight: 600; color: #1e293b; }

    /* Medicines Table */
    .medicines-table { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1rem; background: #f8fafc; color: #64748b; font-size: 0.85rem; font-weight: 700; border-bottom: 2px solid #f1f5f9; }
    td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    .med-details { font-size: 0.8rem; color: #94a3b8; }
    .posologie { font-size: 0.95rem; line-height: 1.4; color: #475569; }
    .stock-check { font-size: 0.8rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; background: #fff1f2; color: #e11d48; }
    .stock-check.ok { background: #f0fdf4; color: #166534; }

    .status-badge { padding: 4px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; display: inline-block; width: fit-content; }
    .status-badge.pending { background: #fffbeb; color: #b45309; }
    .status-badge.fulfilled { background: #dcfce7; color: #166534; }
    
    .instructions-content { line-height: 1.5; color: #475569; font-style: italic; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 25px; width: 100%; max-width: 500px; overflow: hidden; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .form-body { padding: 2rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
    .form-control { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #cbd5e1; font-family: inherit; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; border: 1px solid #cbd5e1; background: white; border-radius: 10px; cursor: pointer; }
    .btn-save { padding: 0.75rem 1.5rem; background: #10b981; color: white; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; }

    @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }
  `
})
export class PrescriptionDetailComponent implements OnInit {
    prescription = signal<Prescription | null>(null);
    showFulfillModal = signal(false);
    isProcessing = signal(false);
    fulfillForm!: FormGroup;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private prescriptionService: PrescriptionService,
        private fb: FormBuilder
    ) {
        this.fulfillForm = this.fb.group({
            verificationNotes: [''],
            markAsPartiallyFulfilled: [false]
        });
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            this.loadPrescription(id);
        });

        this.route.queryParams.subscribe(params => {
            if (params['action'] === 'fulfill') {
                this.openFulfillModal();
            }
        });
    }

    loadPrescription(id: number) {
        this.prescriptionService.getPrescription(id).subscribe(data => this.prescription.set(data));
    }

    openFulfillModal() {
        this.showFulfillModal.set(true);
    }

    onFulfill() {
        if (this.fulfillForm.invalid || !this.prescription()) return;
        this.isProcessing.set(true);
        this.prescriptionService.fulfillPrescription(this.prescription()!.id, this.fulfillForm.value).subscribe({
            next: (data) => {
                this.prescription.set(data);
                this.isProcessing.set(false);
                this.showFulfillModal.set(false);
                alert('Ordonnance servie avec succès');
            },
            error: (err) => {
                this.isProcessing.set(false);
                alert(err.message);
            }
        });
    }

    printPrescription() {
        window.print();
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'PENDING': return 'EN ATTENTE';
            case 'FULFILLED': return 'SERVIE';
            case 'CANCELLED': return 'ANNULÉE';
            default: return status;
        }
    }
}
