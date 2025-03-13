import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.checkSession().pipe(
      map(response => {
        if (response.authenticated) {
          // Check if the route requires a specific role
          const requiredRole = route.data['role'];
          if (requiredRole && response.role !== requiredRole) {
            this.router.navigate(['/login']);
            return false;
          }
          return true;
        }
        
        // Not authenticated, redirect to login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}