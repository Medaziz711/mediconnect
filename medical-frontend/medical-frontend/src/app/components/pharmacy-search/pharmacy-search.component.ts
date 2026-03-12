import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PharmacistResponse } from '../../core/services/api.service';

@Component({
  selector: 'app-pharmacy-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pharmacy-search">
      <div class="search-header">
        <h2>Find Nearby Pharmacies</h2>
        <p>Search for pharmacies based on your location</p>
      </div>

      <div class="search-controls">
        <div class="location-inputs">
          <div class="form-group">
            <label>Latitude</label>
            <input
              type="number"
              [(ngModel)]="latitude"
              placeholder="e.g., 33.5731"
              step="any"
            />
          </div>
          <div class="form-group">
            <label>Longitude</label>
            <input
              type="number"
              [(ngModel)]="longitude"
              placeholder="e.g., -7.5898"
              step="any"
            />
          </div>
        </div>
        <button type="button" class="location-btn" (click)="getCurrentLocation()">
          📍 Use My Location
        </button>
        <div class="search-options">
          <div class="form-group">
            <label>Search Radius (km)</label>
            <input
              type="number"
              [(ngModel)]="radius"
              min="1"
              max="100"
              placeholder="10"
            />
          </div>
          <button type="button" class="search-btn" (click)="searchPharmacies()" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              🔍 Search
            }
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      @if (pharmacies().length > 0) {
        <div class="pharmacy-list">
          <div class="sort-controls">
            <label>Sort by:</label>
            <select [(ngModel)]="sortBy" (change)="sortPharmacies()">
              <option value="distance">Distance</option>
              <option value="name">Name</option>
            </select>
          </div>

          @for (pharmacy of sortedPharmacies(); track pharmacy.id) {
            <div class="pharmacy-card">
              <div class="pharmacy-header">
                <h3>{{ pharmacy.pharmacyName || pharmacy.name }}</h3>
                @if (pharmacy.distance !== undefined) {
                  <span class="distance-badge">
                    📍 {{ pharmacy.distance.toFixed(2) }} km away
                  </span>
                }
              </div>
              <div class="pharmacy-details">
                <p><strong>Pharmacist:</strong> {{ pharmacy.name }}</p>
                @if (pharmacy.email) {
                  <p><strong>Email:</strong> {{ pharmacy.email }}</p>
                }
                @if (pharmacy.phone) {
                  <p><strong>Phone:</strong> {{ pharmacy.phone }}</p>
                }
                @if (pharmacy.address) {
                  <p><strong>Address:</strong> {{ pharmacy.address }}</p>
                }
                @if (pharmacy.latitude && pharmacy.longitude) {
                  <p class="coordinates">
                    <strong>Location:</strong> {{ pharmacy.latitude.toFixed(6) }}, {{ pharmacy.longitude.toFixed(6) }}
                  </p>
                }
              </div>
              <div class="pharmacy-actions">
                <button type="button" class="action-btn" (click)="getDirections(pharmacy)">
                  🗺️ Get Directions
                </button>
                <button type="button" class="action-btn" (click)="contactPharmacy(pharmacy)">
                  📞 Contact
                </button>
              </div>
            </div>
          }
        </div>
      } @else if (!loading() && hasSearched()) {
        <div class="no-results">
          <p>No pharmacies found in the specified radius.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .pharmacy-search {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .search-header {
      margin-bottom: 2rem;
    }

    .search-header h2 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .search-header p {
      color: #666;
      margin: 0;
    }

    .search-controls {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .location-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .form-group input,
    .form-group select {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .location-btn,
    .search-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .location-btn {
      background: #e0e8ff;
      color: #667eea;
      width: 100%;
      margin-bottom: 1rem;
    }

    .location-btn:hover {
      background: #d0d8ff;
    }

    .search-options {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1rem;
      align-items: end;
    }

    .search-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-width: 150px;
    }

    .search-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .search-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      padding: 1rem;
      background: #f8d7da;
      color: #721c24;
      border-radius: 8px;
      margin-bottom: 1rem;
      border-left: 4px solid #dc3545;
    }

    .pharmacy-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sort-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .sort-controls label {
      font-weight: 600;
      color: #333;
    }

    .pharmacy-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .pharmacy-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .pharmacy-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .pharmacy-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.25rem;
    }

    .distance-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .pharmacy-details {
      margin-bottom: 1rem;
    }

    .pharmacy-details p {
      margin: 0.5rem 0;
      color: #666;
    }

    .pharmacy-details strong {
      color: #333;
    }

    .coordinates {
      font-family: monospace;
      font-size: 0.9rem;
    }

    .pharmacy-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #667eea;
      background: white;
      color: #667eea;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-btn:hover {
      background: #667eea;
      color: white;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .pharmacy-search {
        padding: 1rem;
      }

      .location-inputs {
        grid-template-columns: 1fr;
      }

      .search-options {
        grid-template-columns: 1fr;
      }

      .pharmacy-header {
        flex-direction: column;
      }
    }
  `,
})
export class PharmacySearchComponent implements OnInit {
  latitude: string = '';
  longitude: string = '';
  radius: number = 10;
  sortBy: 'distance' | 'name' = 'distance';

  pharmacies = signal<PharmacistResponse[]>([]);
  loading = signal(false);
  error = signal('');
  hasSearched = signal(false);

  sortedPharmacies = computed(() => {
    const sorted = [...this.pharmacies()];
    if (this.sortBy === 'distance') {
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      return sorted.sort((a, b) => (a.pharmacyName || a.name).localeCompare(b.pharmacyName || b.name));
    }
  });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.getCurrentLocation();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      this.loading.set(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude.toFixed(6);
          this.longitude = position.coords.longitude.toFixed(6);
          this.loading.set(false);
          this.error.set('');
        },
        (error) => {
          this.loading.set(false);
          this.error.set('Failed to get your location. Please enter coordinates manually.');
        }
      );
    } else {
      this.error.set('Geolocation is not supported by your browser.');
    }
  }

  searchPharmacies() {
    if (!this.latitude || !this.longitude) {
      this.error.set('Please provide latitude and longitude.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.hasSearched.set(true);

    this.api
      .getPharmacies(parseFloat(this.latitude), parseFloat(this.longitude), this.radius)
      .subscribe({
        next: (pharmacies) => {
          this.pharmacies.set(pharmacies);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to search pharmacies.');
          this.loading.set(false);
        },
      });
  }

  sortPharmacies() {
    // Sorting is handled by computed signal
  }

  getDirections(pharmacy: PharmacistResponse) {
    if (pharmacy.latitude && pharmacy.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`;
      window.open(url, '_blank');
    }
  }

  contactPharmacy(pharmacy: PharmacistResponse) {
    if (pharmacy.phone) {
      window.location.href = `tel:${pharmacy.phone}`;
    } else if (pharmacy.email) {
      window.location.href = `mailto:${pharmacy.email}`;
    }
  }
}
