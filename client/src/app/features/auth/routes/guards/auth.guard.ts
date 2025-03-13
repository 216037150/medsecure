import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const router = inject(Router);

  // Check if there's an auth token
  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
