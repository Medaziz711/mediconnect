import { inject } from '@angular/core';
import { Router } from '@angular/router';

export function authGuard(): boolean {
  const router = inject(Router);
  const user = localStorage.getItem('user');
  if (user) {
    try {
      JSON.parse(user);
      return true;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
  router.navigate(['/auth']);
  return false;
}
