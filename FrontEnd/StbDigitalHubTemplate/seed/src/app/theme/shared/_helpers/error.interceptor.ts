import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthenticationService } from '../service/authentication.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((err) => {
      if ([401, 403].includes(err.status)) {
        const authService = injector.get(AuthenticationService);
        authService.logout();
      }

      const error = err.error?.message || err.message || `HTTP Error ${err.status}`;
      return throwError(() => error);
    })
  );
};
