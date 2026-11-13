import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const sessionVersion = auth.sessionVersion;
  const isApi = request.url.startsWith(`${environment.apiUrl}/`);
  const isPublicAuth =
    request.url === `${environment.apiUrl}/auth/login` ||
    request.url === `${environment.apiUrl}/auth/oidc/google/exchange`;
  const token = isApi && !isPublicAuth ? auth.accessToken : null;
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (
        isApi &&
        !isPublicAuth &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        sessionVersion === auth.sessionVersion
      ) {
        auth.logout(true);
      }
      return throwError(() => error);
    }),
  );
};
