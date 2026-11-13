import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { Permiso } from './permissions';
import { PerfilQueries } from './perfil.queries';

export function requirePermissions(...permisos: Permiso[]): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const client = inject(QueryClient);
    const queries = inject(PerfilQueries);
    if (!auth.accessToken) return router.createUrlTree(['/login']);
    const version = auth.sessionVersion;

    try {
      const options = queries.actual();
      const perfil = await client.fetchQuery(options);
      if (!auth.accessToken) return router.createUrlTree(['/login']);
      if (version !== auth.sessionVersion) return router.createUrlTree(['/admin']);
      // Una actualización fallida puede conservar datos anteriores en la caché.
      if (client.getQueryState(options.queryKey)?.status === 'error') {
        throw new Error('No se pudo actualizar el perfil.');
      }
      return permisos.every((permiso) => perfil.permisos.includes(permiso))
        ? true
        : router.createUrlTree(['/admin/acceso'], { queryParams: { motivo: 'denegado' } });
    } catch {
      if (!auth.accessToken) return router.createUrlTree(['/login']);
      if (version !== auth.sessionVersion) return router.createUrlTree(['/admin']);
      return router.createUrlTree(['/admin/acceso'], {
        queryParams: { motivo: 'error', volver: state.url },
      });
    }
  };
}
