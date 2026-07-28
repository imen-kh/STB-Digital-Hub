import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthenticationService } from '../service/authentication.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((err) => {
      const isAuthChallenge =
        req.url.includes('/api/auth/login') ||
        req.url.includes('/api/auth/verify-otp') ||
        req.url.includes('/api/auth/resend-otp') ||
        req.url.includes('/api/auth/register') ||
        req.url.includes('/api/auth/forgot-password') ||
        req.url.includes('/api/auth/reset-password') ||
        req.url.includes('/api/account/login') ||
        req.url.includes('/api/account/verify-otp') ||
        req.url.includes('/api/account/resend-otp') ||
        req.url.includes('/api/account/register') ||
        req.url.includes('/api/account/forgot-password') ||
        req.url.includes('/api/account/reset-password');

      // Do not destroy a pending OTP flow on auth challenge errors
      if ([401, 403].includes(err.status) && !isAuthChallenge) {
        const authService = injector.get(AuthenticationService);
        authService.logout(true);
      }

      const error = err.error?.message || err.message || `HTTP Error ${err.status}`;
      return throwError(() => error);
    })
  );
};
