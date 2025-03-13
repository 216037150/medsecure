import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): Observable<boolean> {
    // TODO: Implement actual subscription check logic
    return of(true);
  }
}