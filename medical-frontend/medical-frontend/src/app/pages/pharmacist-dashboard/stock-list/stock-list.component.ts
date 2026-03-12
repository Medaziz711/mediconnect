import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService, MedicineStock, AddMedicineRequest, UpdateStockRequest } from '../../../core/services/stock.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-stock-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="stock-container">
      <header class="stock-header">
        <div class="header-left">
          <h2>📦 Gestion de Stock</h2>
          <p>Gérez vos médicaments, prix et quantités en temps réel.</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span>➕</span> Ajouter un Médicament
        </button>
      </header>

      <!-- Filters & Search -->
      <section class="filters-search">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Rechercher par nom, fabricant..." 
                 [ngModel]="searchQuery()" (ngModelChange)="updateSearch($event)">
        </div>
        <div class="filter-tabs">
          <button [class.active]="activeFilter() === 'ALL'" (click)="setFilter('ALL')">Tous ({{ stock().length }})</button>
          <button [class.active]="activeFilter() === 'LOW'" (click)="setFilter('LOW')">Stock Faible (<10)</button>
          <button [class.active]="activeFilter() === 'EXPIRING'" (click)="setFilter('EXPIRING')">Expire Bientôt (<30j)</button>
        </div>
      </section>

      <!-- Stock Table -->
      <div class="table-card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Médicament</th>
                <th>Fabricant</th>
                <th>Quantité</th>
                <th>Prix (DT)</th>
                <th>Expiration</th>
                <th>Prescription</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredStock(); track item.id) {
                <tr>
                  <td>
                    <div class="med-name">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.dosage }} - {{ item.form }}</span>
                    </div>
                  </td>
                  <td>{{ item.manufacturer }}</td>
                  <td>
                    <span class="qty-badge" [class.low]="item.quantity < 10">{{ item.quantity }}</span>
                  </td>
                  <td>{{ item.price | number:'1.2-2' }}</td>
                  <td>{{ item.expiryDate | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="rx-badge" [class.required]="item.requiresPrescription">
                      {{ item.requiresPrescription ? 'OUI' : 'NON' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-indicator" [ngClass]="getStatus(item)">
                      {{ getStatusText(item) }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="btn-icon edit" (click)="openEditModal(item)" title="Modifier">✏️</button>
                      <button class="btn-icon delete" (click)="deleteMedicine(item.id)" title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              }
              @if (filteredStock().length === 0) {
                <tr>
                  <td colspan="8" class="empty-state">
                    Aucun médicament trouvé pour ce filtre.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Medicine Modal -->
      <div class="modal-overlay" *ngIf="showAddModal()">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nouveau Médicament</h2>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>
          <form [formGroup]="addForm" (ngSubmit)="onAddMedicine()">
            <div class="form-body">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Nom du Médicament *</label>
                  <input type="text" formControlName="name" class="form-control">
                </div>
                <div class="form-group full-width">
                  <label>Description</label>
                  <textarea formControlName="description" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                  <label>Fabricant</label>
                  <input type="text" formControlName="manufacturer" class="form-control">
                </div>
                <div class="form-group">
                  <label>Dosage (ex: 500mg)</label>
                  <input type="text" formControlName="dosage" class="form-control">
                </div>
                <div class="form-group">
                  <label>Forme (ex: Comprimé)</label>
                  <input type="text" formControlName="form" class="form-control">
                </div>
                <div class="form-group">
                  <label>Quantité *</label>
                  <input type="number" formControlName="quantity" class="form-control">
                </div>
                <div class="form-group">
                  <label>Prix (DT) *</label>
                  <input type="number" step="0.01" formControlName="price" class="form-control">
                </div>
                <div class="form-group">
                  <label>Date d'Expiration *</label>
                  <input type="date" formControlName="expiryDate" class="form-control">
                </div>
                <div class="form-group full-width checkbox-group">
                   <label class="checkbox-container">
                      Nécessite une ordonnance
                      <input type="checkbox" formControlName="requiresPrescription">
                      <span class="checkmark"></span>
                    </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="closeModals()">Annuler</button>
              <button type="submit" class="btn-save" [disabled]="addForm.invalid || isProcessing()">
                {{ isProcessing() ? 'Traitement...' : 'Ajouter' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Stock Modal -->
      <div class="modal-overlay" *ngIf="showEditModal()">
        <div class="modal-content mini">
          <div class="modal-header">
            <h2>Mettre à jour {{ selectedMedicine()?.name }}</h2>
            <button class="close-btn" (click)="closeModals()">✕</button>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="onUpdateStock()">
            <div class="form-body">
              <div class="form-group">
                <label>Quantité</label>
                <input type="number" formControlName="quantity" class="form-control">
              </div>
              <div class="form-group">
                <label>Prix (DT)</label>
                <input type="number" step="0.01" formControlName="price" class="form-control">
              </div>
              <div class="form-group">
                <label>Date d'Expiration</label>
                <input type="date" formControlName="expiryDate" class="form-control">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="closeModals()">Annuler</button>
              <button type="submit" class="btn-save" [disabled]="editForm.invalid || isProcessing()">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: `
    .stock-container { display: flex; flex-direction: column; gap: 2rem; }
    
    .stock-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left h2 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; }
    .header-left p { color: #64748b; margin: 0.25rem 0 0; }
    .btn-primary { 
      background: #0891b2; color: white; border: none; padding: 0.85rem 1.75rem; 
      border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .btn-primary:hover { background: #155e75; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(8,145,178,0.25); }

    /* Filters */
    .filters-search { 
      display: flex; justify-content: space-between; align-items: center; gap: 2rem;
      background: white; padding: 1rem; border-radius: 20px; border: 1px solid #e2e8f0;
    }
    .search-bar { 
      flex: 1; display: flex; align-items: center; gap: 0.75rem; background: #f8fafc;
      padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
    }
    .search-bar input { background: none; border: none; width: 100%; font-family: inherit; font-size: 0.95rem; }
    .search-bar input:focus { outline: none; }
    
    .filter-tabs { display: flex; gap: 0.5rem; }
    .filter-tabs button { 
      background: none; border: 1px solid transparent; padding: 0.6rem 1rem; border-radius: 10px;
      font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s;
    }
    .filter-tabs button:hover { background: #f1f5f9; }
    .filter-tabs button.active { background: #ecfeff; color: #0891b2; border-color: #0891b2; }

    /* Table */
    .table-card { background: white; border-radius: 25px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
    td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    
    .med-name { display: flex; flex-direction: column; gap: 0.1rem; }
    .med-name strong { font-size: 1rem; color: #1e293b; }
    .med-name span { font-size: 0.8rem; color: #94a3b8; }
    
    .qty-badge { padding: 4px 10px; border-radius: 8px; font-weight: 800; background: #f1f5f9; color: #475569; }
    .qty-badge.low { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
    
    .rx-badge { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: #f1f5f9; }
    .rx-badge.required { background: #fffbeb; color: #b45309; }
    
    .status-indicator { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; }
    .status-indicator.normal { background: #dcfce7; color: #166534; }
    .status-indicator.low { background: #fff7ed; color: #9a3412; }
    .status-indicator.expiring { background: #fef2f2; color: #991b1b; }

    .btn-group { display: flex; gap: 0.5rem; }
    .btn-icon { width: 35px; height: 35px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-icon:hover { transform: scale(1.1); }
    .btn-icon.edit:hover { border-color: #0891b2; color: #0891b2; }
    .btn-icon.delete:hover { border-color: #ef4444; color: #ef4444; }

    .empty-state { text-align: center; padding: 3rem !important; color: #94a3b8; font-style: italic; }

    /* Modals - Common */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 25px; width: 100%; max-width: 650px; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
    .modal-content.mini { max-width: 400px; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 2rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: #64748b; margin-bottom: 0.4rem; display: block; }
    .form-control { width: 100%; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 10px; }
    
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; }
    .btn-save { padding: 0.75rem 1.5rem; border-radius: 10px; border: none; background: #0891b2; color: white; font-weight: 700; cursor: pointer; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    .checkbox-container { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #1e293b; cursor: pointer; }

    @media (max-width: 768px) {
      .filters-search { flex-direction: column; align-items: stretch; gap: 1rem; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `
})
export class StockListComponent implements OnInit {
    stock = signal<MedicineStock[]>([]);
    searchQuery = signal('');
    activeFilter = signal<'ALL' | 'LOW' | 'EXPIRING'>('ALL');

    showAddModal = signal(false);
    showEditModal = signal(false);
    selectedMedicine = signal<MedicineStock | null>(null);
    isProcessing = signal(false);

    addForm!: FormGroup;
    editForm!: FormGroup;

    constructor(
        private stockService: StockService,
        private fb: FormBuilder,
        private route: ActivatedRoute
    ) {
        this.initForms();
    }

    ngOnInit() {
        this.loadStock();

        // Check for query params
        this.route.queryParams.subscribe(params => {
            if (params['action'] === 'add') this.openAddModal();
            if (params['filter'] === 'low') this.setFilter('LOW');
        });
    }

    initForms() {
        this.addForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            manufacturer: [''],
            dosage: [''],
            form: [''],
            quantity: [0, [Validators.required, Validators.min(0)]],
            price: [0, [Validators.required, Validators.min(0)]],
            expiryDate: ['', Validators.required],
            requiresPrescription: [false]
        });

        this.editForm = this.fb.group({
            quantity: [0, [Validators.required, Validators.min(0)]],
            price: [0, [Validators.required, Validators.min(0)]],
            expiryDate: ['', Validators.required]
        });
    }

    loadStock() {
        this.stockService.getStock().subscribe(data => this.stock.set(data));
    }

    filteredStock() {
        let result = this.stock().filter(item =>
            item.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
            item.manufacturer.toLowerCase().includes(this.searchQuery().toLowerCase())
        );

        if (this.activeFilter() === 'LOW') {
            result = result.filter(item => item.quantity < 10);
        } else if (this.activeFilter() === 'EXPIRING') {
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            const now = new Date().getTime();
            result = result.filter(item => {
                const expiry = new Date(item.expiryDate).getTime();
                return (expiry - now) < thirtyDays;
            });
        }

        return result;
    }

    updateSearch(q: string) {
        this.searchQuery.set(q);
    }

    setFilter(f: 'ALL' | 'LOW' | 'EXPIRING') {
        this.activeFilter.set(f);
    }

    getStatus(item: MedicineStock): string {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        if (new Date(item.expiryDate).getTime() - now < thirtyDays) return 'expiring';
        if (item.quantity < 10) return 'low';
        return 'normal';
    }

    getStatusText(item: MedicineStock): string {
        const status = this.getStatus(item);
        if (status === 'expiring') return 'EXPIRATION PROCHE';
        if (status === 'low') return 'STOCK FAIBLE';
        return 'EN STOCK';
    }

    openAddModal() {
        this.addForm.reset({ quantity: 0, price: 0, requiresPrescription: false });
        this.showAddModal.set(true);
    }

    openEditModal(item: MedicineStock) {
        this.selectedMedicine.set(item);
        this.editForm.patchValue({
            quantity: item.quantity,
            price: item.price,
            expiryDate: item.expiryDate.split('T')[0]
        });
        this.showEditModal.set(true);
    }

    closeModals() {
        this.showAddModal.set(false);
        this.showEditModal.set(false);
        this.selectedMedicine.set(null);
    }

    onAddMedicine() {
        if (this.addForm.invalid) return;
        this.isProcessing.set(true);
        this.stockService.addMedicine(this.addForm.value).subscribe({
            next: () => {
                this.loadStock();
                this.isProcessing.set(false);
                this.closeModals();
                alert('Médicament ajouté');
            },
            error: (err) => {
                this.isProcessing.set(false);
                alert(err.message);
            }
        });
    }

    onUpdateStock() {
        if (this.editForm.invalid || !this.selectedMedicine()) return;
        this.isProcessing.set(true);
        this.stockService.updateStock(this.selectedMedicine()!.id, this.editForm.value).subscribe({
            next: () => {
                this.loadStock();
                this.isProcessing.set(false);
                this.closeModals();
                alert('Stock mis à jour');
            },
            error: (err) => {
                this.isProcessing.set(false);
                alert(err.message);
            }
        });
    }

    deleteMedicine(id: number) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce médicament du stock ?')) {
            this.stockService.deleteMedicine(id).subscribe(() => {
                this.loadStock();
            });
        }
    }
}
