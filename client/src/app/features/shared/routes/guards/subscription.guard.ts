import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const path = route.routeConfig?.path;

    // Allow access to practice-info
    if (path === 'practice-info') {
      return true;
    }

    // For payment-info, check if practice info exists
    if (path === 'payment-info') {
      const practiceData = localStorage.getItem('practiceData');
      if (!practiceData) {
        this.router.navigate(['/payment/practice-info']);
        return false;
      }
      return true;
    }

    // For subscription-confirmation, check if both practice and payment info exist
    if (path === 'subscription-confirmation') {
      const practiceData = localStorage.getItem('practiceData');
      const subscriptionData = localStorage.getItem('subscriptionData');
      
      if (!practiceData || !subscriptionData) {
        this.router.navigate(['/payment/practice-info']);
        return false;
      }
      return true;
    }

    return false;
  }
}
