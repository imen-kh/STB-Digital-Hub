import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChildFn } from '@angular/router';
import { Observable, of, map, catchError } from 'rxjs';

import { AuthenticationService } from '../service/authentication.service';
import { User } from './user';

function checkAuthorization(route: ActivatedRouteSnapshot, state: RouterStateSnapshot, currentUser: User, router: Router): boolean {
  const { roles } = route.data;
  if (roles && !roles.includes(currentUser.user.role)) {
    router.navigate(['/unauthorized']);
    return false;
  }
  return true;
}

export const authGuardChild: CanActivateChildFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | Observable<boolean> => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);

  const currentUser = authenticationService.currentUserValue;
  const hasToken = !!authenticationService.getToken();

  // If we have a token but no user data, fetch it first
  if (hasToken && !currentUser && !authenticationService.isLoading) {
    return authenticationService.fetchCurrentUser().pipe(
      map((user) => {
        authenticationService.isLogin = true;
        return checkAuthorization(route, state, user, router);
      }),
      catchError(() => {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  }

  // If user data is currently loading, wait for it to complete
  if (authenticationService.isLoading) {
    return new Observable<boolean>((observer) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max (50 * 100ms)

      const checkInterval = setInterval(() => {
        attempts++;
        if (!authenticationService.isLoading || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          const user = authenticationService.currentUserValue;
          if (user && authenticationService.isLoggedIn()) {
            observer.next(checkAuthorization(route, state, user, router));
          } else {
            router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
            observer.next(false);
          }
          observer.complete();
        }
      }, 100);
    });
  }

  // If we have user data, check authorization
  if (currentUser && authenticationService.isLoggedIn()) {
    return checkAuthorization(route, state, currentUser, router);
  }

  // User not logged in, redirect to login page
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
