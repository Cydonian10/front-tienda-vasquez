import { inject, Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { Permiso } from './permissions';
import { PerfilQueries } from './perfil.queries';

/** Consulta compartida; TanStack sigue siendo la única fuente del perfil remoto. */
@Injectable({ providedIn: 'root' })
export class PerfilAccess {
  private readonly auth = inject(AuthService);
  private readonly queries = inject(PerfilQueries);

  readonly perfil = injectQuery(() => ({
    ...this.queries.actual(),
    enabled: !!this.auth.session(),
  }));

  puede(permiso: Permiso): boolean {
    return (
      !!this.auth.accessToken &&
      !this.perfil.isError() &&
      (this.perfil.data()?.permisos.includes(permiso) ?? false)
    );
  }
}
