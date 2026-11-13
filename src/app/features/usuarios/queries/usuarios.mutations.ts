import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom, tap } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { UsuariosApi } from '../api/usuarios.api';
import { NuevoUsuario, UsuarioDatos } from '../models/usuario.model';
import { usuariosKeys } from './usuarios.keys';

@Injectable({ providedIn: 'root' })
export class UsuariosMutations {
  private readonly api = inject(UsuariosApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);

  /** La contraseña no pasa por MutationCache ni se conserva como variables de TanStack. */
  crear(datos: NuevoUsuario) {
    const version = this.auth.sessionVersion;
    return this.api.crear(datos).pipe(
      tap(() => {
        if (version === this.auth.sessionVersion)
          void this.client.invalidateQueries({ queryKey: usuariosKeys.lista });
      }),
    );
  }

  actualizar() {
    return mutationOptions({
      mutationKey: [...usuariosKeys.all, 'actualizar'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, datos }: { id: string; datos: UsuarioDatos }) =>
        firstValueFrom(this.api.actualizar(id, datos)),
      onSuccess: async (usuario, _variables, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.cancelQueries({ queryKey: usuariosKeys.detalle(usuario.id) });
        if (version !== this.auth.sessionVersion) return;
        this.client.setQueryData(usuariosKeys.detalle(usuario.id), usuario);
        await this.client.invalidateQueries({ queryKey: usuariosKeys.lista });
        if (version === this.auth.sessionVersion && usuario.id === this.auth.userId()) {
          await this.client.invalidateQueries({ queryKey: ['perfil'] });
        }
      },
    });
  }

  asignarRoles() {
    return mutationOptions({
      mutationKey: [...usuariosKeys.all, 'asignar-roles'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, rolIds }: { id: string; rolIds: string[] }) =>
        firstValueFrom(this.api.asignarRoles(id, rolIds)),
      onSuccess: async (_roles, { id }, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.invalidateQueries({ queryKey: usuariosKeys.roles(id) });
        if (version === this.auth.sessionVersion && id === this.auth.userId()) {
          await this.client.invalidateQueries({ queryKey: ['perfil'] });
        }
      },
    });
  }
}
