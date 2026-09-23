import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from 'src/environments/environment';

export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getTokenFromStorage();
  const isApiUrl = environment.apiUrl
    ? req.url.startsWith(environment.apiUrl)
    : req.url.startsWith('/api') || req.url.startsWith('/uploads');

  if (isApiUrl) {
    const headers: Record<string, string> = {
      'X-App-Origin': window.location.origin
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    req = req.clone({ setHeaders: headers });
  }

  return next(req);
};

function getTokenFromStorage(): string | null {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.serviceToken || null;
    } catch {
      return null;
    }
  }
  return null;
}
