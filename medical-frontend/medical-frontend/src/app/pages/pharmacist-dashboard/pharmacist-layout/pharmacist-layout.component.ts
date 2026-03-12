import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserResponse } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-pharmacist-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pharmacist-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.mobile-open]="isMobileMenuOpen()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">💊</span>
            <h2>PharmaConnect</h2>
          </div>
          <button class="mobile-close" (click)="toggleMobileMenu()">✕</button>
        </div>

        <nav class="nav-links">
          <a routerLink="dashboard" routerLinkActive="active" (click)="closeMobileMenu()">
            <span class="icon">📊</span> Tableau de bord
          </a>
          <a routerLink="profile" routerLinkActive="active" (click)="closeMobileMenu()">
            <span class="icon">👤</span> Mon Profil
          </a>
          <a routerLink="stock" routerLinkActive="active" (click)="closeMobileMenu()">
            <span class="icon">📦</span> Gestion de stock
          </a>
          <a routerLink="prescriptions" routerLinkActive="active" (click)="closeMobileMenu()">
            <span class="icon">📋</span> Prescriptions
          </a>
          <!-- <a routerLink="settings" routerLinkActive="active" (click)="closeMobileMenu()">
            <span class="icon">⚙️</span> Paramètres
          </a> -->
        </nav>

        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <span class="icon">🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">
        <header class="main-header">
          <div class="header-left">
            <button class="menu-toggle" (click)="toggleMobileMenu()">☰</button>
            <h1 class="page-title">Bienvenue, {{ user()?.firstName || user()?.name }}</h1>
          </div>
          <div class="header-right">
            <div class="notif-badge">
              <span class="icon">🔔</span>
              <span class="count">2</span>
            </div>
            <div class="user-profile" (click)="router.navigate(['/pharmacist/profile'])">
               <img *ngIf="user()?.profilePhoto; else textAvatar" 
                    [src]="getFullPhotoUrl(user()?.profilePhoto)" 
                    class="avatar-img" alt="Profile">
               <ng-template #textAvatar>
                 <div class="avatar-text">{{ user()?.name?.charAt(0) }}</div>
               </ng-template>
            </div>
          </div>
        </header>

        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      --primary: #0891b2;
      --primary-dark: #155e75;
      --bg-light: #f8fafc;
      --sidebar-bg: #ffffff;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .pharmacist-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-light);
      font-family: 'Inter', sans-serif;
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      transition: all 0.3s ease;
    }

    .sidebar-header {
      padding: 2rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .logo h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary-dark);
      margin: 0;
      letter-spacing: -0.5px;
    }

    .mobile-close {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .nav-links {
      flex: 1;
      padding: 0 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }

    .nav-links a:hover {
      background: #f1f5f9;
      color: var(--primary);
    }

    .nav-links a.active {
      background: #ecfeff;
      color: var(--primary);
      box-shadow: inset 4px 0 0 var(--primary);
    }

    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .logout-btn {
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid #fee2e2;
      background: #fef2f2;
      color: #ef4444;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: #fee2e2;
      transform: translateY(-1px);
    }

    /* Main Content */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .main-header {
      height: 70px;
      background: white;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .notif-badge {
      position: relative;
      cursor: pointer;
      color: var(--text-muted);
    }

    .notif-badge .count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 10px;
      border: 2px solid white;
    }

    .user-profile {
      cursor: pointer;
    }

    .avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      object-fit: cover;
      border: 2px solid var(--border-color);
    }

    .avatar-text {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
    }

    .content-area {
      padding: 2rem;
      flex: 1;
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
      .sidebar {
        position: fixed;
        left: -280px;
      }

      .sidebar.mobile-open {
        left: 0;
      }

      .menu-toggle {
        display: block;
      }

      .mobile-close {
        display: block;
      }

      .main-header {
        padding: 0 1rem;
      }

      .content-area {
        padding: 1rem;
      }
    }
  `
})
export class PharmacistLayoutComponent implements OnInit {
  user = signal<UserResponse | null>(null);
  isMobileMenuOpen = signal(false);

  constructor(public router: Router) { }

  ngOnInit() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user.set(JSON.parse(userStr));
    } else {
      this.router.navigate(['/auth']);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth']);
  }

  getFullPhotoUrl(photoPath: string | null | undefined): string {
    if (!photoPath) return '';
    if (photoPath.startsWith('data:') || photoPath.startsWith('http')) return photoPath;

    // Use environment.apiUrl but remove /api suffix to get base URL
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${photoPath}?t=${new Date().getTime()}`;
  }
}

