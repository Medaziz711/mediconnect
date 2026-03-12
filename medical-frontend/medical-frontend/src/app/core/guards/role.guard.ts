import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';

export function roleGuard(route: ActivatedRouteSnapshot): boolean {
    const router = inject(Router);
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        router.navigate(['/auth']);
        return false;
    }

    try {
        const user = JSON.parse(userStr);
        const expectedRoles = route.data['roles'] as Array<string>;

        // Convert role to standard uppercase for comparison
        const userRole = (user.role || '').toUpperCase();

        if (expectedRoles && expectedRoles.includes(userRole)) {
            return true;
        }

        // Role mismatch - redirect to their appropriate home
        console.warn(`Access denied for role: ${userRole}. Missing one of: ${expectedRoles}`);

        if (userRole.includes('ADMIN')) router.navigate(['/admin']);
        else if (userRole === 'PATIENT') router.navigate(['/patient']);
        else if (userRole === 'DOCTOR') router.navigate(['/doctor']);
        else if (userRole === 'PHARMACIST') router.navigate(['/pharmacist/dashboard']);
        else router.navigate(['/home']);

        return false;
    } catch {
        router.navigate(['/auth']);
        return false;
    }
}
