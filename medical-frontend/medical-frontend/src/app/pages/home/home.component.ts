import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="home-container">
      <div class="glass-bg"></div>
      
      <main class="content">
        <div class="hero-section">
          <div class="badge">Session Active</div>
          <h1>Bienvenue sur Mediconnect Pro</h1>
          <p class="subtitle">Le portail professionnel de santé nouvelle génération.</p>
          
          <div class="status-indicator" [class.connected]="connectionStatus() === 'connected'">
            <span class="pulse"></span>
            Backend : {{ connectionStatus() === 'connected' ? 'Connecté' : 'En attente...' }}
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="feature-card">
            <div class="card-icon">🔐</div>
            <h3>Profil Professionnel</h3>
            <p>Votre espace personnalisé est en cours de déploiement.</p>
            <div class="progress-bar"><div class="progress" style="width: 75%"></div></div>
          </div>

          <div class="feature-card">
            <div class="card-icon">🚀</div>
            <h3>Nouveautés</h3>
            <p>Découvrez prochainement vos outils de gestion patient.</p>
          </div>
        </div>

        <div class="actions">
          <button (click)="logout()" class="btn-logout">
            <span class="icon">🚪</span> Déconnexion et retour à l'accueil
          </button>
        </div>
      </main>

      <footer class="footer">
        &copy; 2026 Mediconnect Pro. Design Premium.
      </footer>
    </div>
  `,
  styles: `
    :host {
      --primary: #0d9488;
      --primary-glow: rgba(13, 148, 136, 0.4);
      --bg-dark: #0f172a;
      --text-light: #f8fafc;
      --text-dim: #94a3b8;
    }

    .home-container {
      min-height: 100vh;
      background: var(--bg-dark);
      color: var(--text-light);
      font-family: 'Inter', sans-serif;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .glass-bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(13, 148, 136, 0.15), transparent 70%);
      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 900px;
      padding: 2rem;
      text-align: center;
    }

    .hero-section {
      margin-bottom: 4rem;
    }

    .badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: rgba(13, 148, 136, 0.1);
      border: 1px solid var(--primary);
      color: var(--primary);
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: clamp(2.5rem, 8vw, 4rem);
      font-weight: 900;
      letter-spacing: -2px;
      margin: 0;
      background: linear-gradient(to right, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1.25rem;
      color: var(--text-dim);
      margin-top: 1rem;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 2rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      font-size: 0.9rem;
      color: var(--text-dim);
    }

    .pulse {
      width: 8px;
      height: 8px;
      background: #f43f5e;
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(244, 63, 94, 0.4);
      animation: pulse 2s infinite;
    }

    .status-indicator.connected .pulse {
      background: #10b981;
      box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
      animation: pulse-green 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
    }

    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 2.5rem;
      border-radius: 24px;
      text-align: left;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
    }

    .feature-card:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-5px);
      border-color: var(--primary);
    }

    .card-icon {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
    }

    .feature-card h3 {
      font-size: 1.4rem;
      margin: 0 0 0.75rem 0;
      color: white;
    }

    .feature-card p {
      color: var(--text-dim);
      line-height: 1.6;
      margin: 0;
    }

    .progress-bar {
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      margin-top: 1.5rem;
      overflow: hidden;
    }

    .progress {
      height: 100%;
      background: var(--primary);
      box-shadow: 0 0 10px var(--primary-glow);
    }

    .actions {
      display: flex;
      justify-content: center;
    }

    .btn-logout {
      background: transparent;
      border: 1.5px solid #f43f5e;
      color: #f43f5e;
      padding: 1rem 2rem;
      border-radius: 15px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s;
    }

    .btn-logout:hover {
      background: #f43f5e;
      color: white;
      box-shadow: 0 10px 20px rgba(244, 63, 94, 0.2);
    }

    .footer {
      position: absolute;
      bottom: 2rem;
      color: rgba(255,255,255,0.2);
      font-size: 0.8rem;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  `,
})
export class HomeComponent implements OnInit {
  connectionStatus = signal<'checking' | 'connected' | 'error'>('checking');

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.checkBackend();
  }

  private checkBackend() {
    this.api.getUserByEmail('admin@gestion-medicale.com').subscribe({
      next: () => this.connectionStatus.set('connected'),
      error: () => this.connectionStatus.set('error'),
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth']);
  }
}
