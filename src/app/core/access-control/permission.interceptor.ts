import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '@/core/auth/auth.service';

/** Un 403 puede indicar permisos revocados; no equivale a una sesión vencida. */
export const permissionInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const client = inject(QueryClient);
  const version = auth.sessionVersion;
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        request.url.startsWith(`${environment.apiUrl}/`) &&
        !request.url.startsWith(`${environment.apiUrl}/auth/`) &&
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        auth.accessToken &&
        version === auth.sessionVersion
      ) {
        void client.invalidateQueries({ queryKey: ['perfil'] });
      }
      return throwError(() => error);
    }),
  );
};
