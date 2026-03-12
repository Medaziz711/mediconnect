import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent) },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  {
    path: 'admin',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'patient',
    loadComponent: () => import('./pages/patient-dashboard/patient-dashboard.component').then((m) => m.PatientDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'doctor',
    loadComponent: () => import('./pages/doctor-dashboard/doctor-dashboard.component').then((m) => m.DoctorDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'pharmacist',
    loadComponent: () => import('./pages/pharmacist-dashboard/pharmacist-layout/pharmacist-layout.component').then((m) => m.PharmacistLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PHARMACIST'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/pharmacist-dashboard/pharmacist-dashboard/pharmacist-dashboard.component').then((m) => m.PharmacistDashboardComponent) },
      { path: 'profile', loadComponent: () => import('./pages/pharmacist-dashboard/pharmacist-profile/pharmacist-profile.component').then((m) => m.PharmacistProfileComponent) },
      { path: 'stock', loadComponent: () => import('./pages/pharmacist-dashboard/stock-list/stock-list.component').then((m) => m.StockListComponent) },
      { path: 'prescriptions', loadComponent: () => import('./pages/pharmacist-dashboard/prescriptions-list/prescriptions-list.component').then((m) => m.PrescriptionsListComponent) },
      { path: 'prescriptions/:id', loadComponent: () => import('./pages/pharmacist-dashboard/prescription-detail/prescription-detail.component').then((m) => m.PrescriptionDetailComponent) }
    ]
  },
  {
    path: 'dashboard',
    redirectTo: '/home' // Fallback for the old dashboard path
  },
  { path: '**', redirectTo: '/auth' },
];
