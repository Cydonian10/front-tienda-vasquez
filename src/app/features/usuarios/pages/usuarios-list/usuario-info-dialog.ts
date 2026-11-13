import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { AuthService } from '@/core/auth/auth.service';
import { PERMISOS } from '@/core/access-control/permissions';
import { apiErrorMessage } from '@/core/errors/api-error';
import { DialogShell } from '@/shared/components/dialog-shell/dialog-shell';
import { RolUsuario, Usuario } from '../../models/usuario.model';
import { UsuariosQueries } from '../../queries/usuarios.queries';
import { UsuariosMutations } from '../../queries/usuarios.mutations';

@Component({
  selector: 'app-usuario-info-dialog',
  imports: [DialogShell],
  templateUrl: './usuario-info-dialog.html',
})
export class UsuarioInfoDialog {
  protected readonly usuario = inject<Usuario>(DIALOG_DATA);
  private readonly dialog = inject(DialogRef);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(UsuariosQueries);
  private readonly mutations = inject(UsuariosMutations);
  protected readonly roles = injectQuery(() => this.queries.roles(this.usuario.id));
  protected readonly persona = injectQuery(() =>
    this.queries.persona(this.usuario.personaId ?? '', this.access.puede(PERMISOS.PERSONAS.LEER)),
  );
  protected readonly catalogo = injectQuery(() =>
    this.queries.rolesCatalogo(
      this.access.puede(PERMISOS.USUARIOS.ASIGNAR_ROLES) && this.access.puede(PERMISOS.ROLES.LEER),
    ),
  );
  protected readonly asignar = injectMutation(() => this.mutations.asignarRoles());
  protected readonly selected = signal<readonly string[]>([]);
  protected readonly message = signal('');
  protected readonly error = signal('');
  private initialized = false;
  protected readonly puedeAdministrarActuales = computed(() =>
    (this.roles.data() ?? []).every((rol) => this.puedeAdministrar(rol)),
  );
  protected readonly tieneInactivos = computed(() =>
    (this.catalogo.data() ?? []).some((rol) => !rol.activo && this.selected().includes(rol.id)),
  );

  constructor() {
    this.auth.sessionCleared.pipe(takeUntilDestroyed()).subscribe(() => this.dialog.close());
    effect(() => {
      const roles = this.roles.data();
      if (!roles || this.initialized) return;
      this.selected.set(roles.map((rol) => rol.id));
      this.initialized = true;
    });
  }
  protected puedeAdministrar(rol: RolUsuario) {
    return rol.permisos.every((permiso) =>
      this.access.perfil.data()?.permisos.includes(permiso.codigo),
    );
  }
  protected toggle(id: string, checked: boolean) {
    this.selected.update((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((value) => value !== id),
    );
  }
  protected guardar() {
    if (
      !this.access.puede(PERMISOS.USUARIOS.ASIGNAR_ROLES) ||
      !this.puedeAdministrarActuales() ||
      this.tieneInactivos() ||
      this.asignar.isPending()
    )
      return;
    this.message.set('');
    this.error.set('');
    const version = this.auth.sessionVersion;
    this.asignar.mutate(
      { id: this.usuario.id, rolIds: [...this.selected()] },
      {
        onSuccess: (roles) => {
          if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) return;
          this.selected.set(roles.map((rol) => rol.id));
          this.message.set('Roles actualizados correctamente.');
        },
        onError: (error) => {
          if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) return;
          this.error.set(
            apiErrorMessage(
              error,
              'No se pudieron asignar los roles. Verifica que no retires al último administrador.',
            ),
          );
        },
      },
    );
  }
  protected cerrar() {
    if (!this.asignar.isPending()) this.dialog.close();
  }
}
