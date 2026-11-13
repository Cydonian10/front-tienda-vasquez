import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { RolesApi } from '../api/roles.api';
import { NuevoRol, Rol, RolDatos } from '../models/rol.model';
import { rolesKeys } from './roles.keys';

@Injectable({ providedIn: 'root' })
export class RolesMutations {
  private readonly api = inject(RolesApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);

  crear() {
    return mutationOptions({
      mutationKey: [...rolesKeys.all, 'crear'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (datos: NuevoRol) => firstValueFrom(this.api.crear(datos)),
      onSuccess: async (_rol, _datos, version) => {
        if (version === this.auth.sessionVersion)
          await this.client.invalidateQueries({ queryKey: rolesKeys.lista });
      },
    });
  }
  actualizar() {
    return mutationOptions({
      mutationKey: [...rolesKeys.all, 'actualizar'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, datos }: { id: string; datos: RolDatos }) =>
        firstValueFrom(this.api.actualizar(id, datos)),
      onSuccess: (rol, _datos, version) => this.invalidate(rol.id, version),
    });
  }
  eliminar() {
    return mutationOptions({
      mutationKey: [...rolesKeys.all, 'eliminar'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (id: string) => firstValueFrom(this.api.eliminar(id)),
      onSuccess: async (_response, id, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.cancelQueries({ queryKey: rolesKeys.lista, exact: true });
        if (version !== this.auth.sessionVersion) return;
        await this.client.cancelQueries({ queryKey: rolesKeys.detalle(id), exact: true });
        if (version !== this.auth.sessionVersion) return;
        this.client.removeQueries({ queryKey: rolesKeys.detalle(id), exact: true });
        this.client.setQueryData<Rol[]>(rolesKeys.lista, (roles) =>
          roles?.filter((rol) => rol.id !== id),
        );
        await this.client.invalidateQueries({ queryKey: rolesKeys.lista, exact: true });
      },
    });
  }
  asignarPermisos() {
    return mutationOptions({
      mutationKey: [...rolesKeys.all, 'asignar'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, permisoIds }: { id: string; permisoIds: string[] }) =>
        firstValueFrom(this.api.asignarPermisos(id, permisoIds)),
      onSuccess: (rol, _datos, version) => this.invalidate(rol.id, version),
    });
  }
  private async invalidate(id: string, version: number | undefined) {
    if (version !== this.auth.sessionVersion) return;
    await this.client.cancelQueries({ queryKey: rolesKeys.detalle(id) });
    if (version !== this.auth.sessionVersion) return;
    await this.client.invalidateQueries({ queryKey: rolesKeys.detalle(id) });
    if (version !== this.auth.sessionVersion) return;
    await Promise.all([
      this.client.invalidateQueries({ queryKey: rolesKeys.lista }),
      this.client.invalidateQueries({ queryKey: ['usuarios'] }),
      this.client.invalidateQueries({ queryKey: ['perfil'] }),
    ]);
  }
}
