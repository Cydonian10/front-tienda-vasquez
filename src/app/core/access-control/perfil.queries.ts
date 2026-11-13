import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { httpQuery } from '@/core/query/http-query';
import { PerfilApi } from './perfil.api';

@Injectable({ providedIn: 'root' })
export class PerfilQueries {
  private readonly api = inject(PerfilApi);
  private readonly auth = inject(AuthService);

  actual() {
    const userId = this.auth.session()?.userId ?? null;
    const version = this.auth.sessionVersion;
    return queryOptions({
      queryKey: ['perfil', userId, version] as const,
      queryFn: async ({ signal }) => {
        if (!userId || this.auth.sessionVersion !== version) {
          throw new Error('La sesión cambió antes de consultar el perfil.');
        }
        const perfil = await httpQuery(this.api.obtener(), signal);
        if (
          this.auth.sessionVersion !== version ||
          !userId ||
          perfil?.id !== userId ||
          !Array.isArray(perfil.permisos) ||
          !perfil.permisos.every((permiso) => typeof permiso === 'string')
        ) {
          throw new Error('El perfil recibido no corresponde a la sesión actual.');
        }
        return perfil;
      },
      staleTime: 60_000,
      retry: (count, error) =>
        this.auth.sessionVersion === version &&
        !(error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) &&
        count < 1,
    });
  }
}
