import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { map } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { apiErrorMessage } from '@/core/errors/api-error';
import { TextField } from '@/shared/components/text-field/text-field';
import { RolesQueries } from '../../queries/roles.queries';
import { RolesMutations } from '../../queries/roles.mutations';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-rol-form-page',
  imports: [RouterLink, TextField, LucideArrowLeft],
  templateUrl: './rol-form.html',
})
export class RolFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigationMessage =
    this.router.currentNavigation()?.extras.state?.['rolMessage'];
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries = inject(RolesQueries);
  private readonly mutations = inject(RolesMutations);
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  protected readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  protected readonly rol = injectQuery(() => this.queries.obtener(this.id()));
  protected readonly origen = computed(() =>
    this.access.puede(PERMISOS.FEATURES.LEER) ? 'features' : 'permisos',
  );
  protected readonly tieneCatalogo = computed(
    () => this.access.puede(PERMISOS.FEATURES.LEER) || this.access.puede(PERMISOS.PERMISOS.LEER),
  );
  protected readonly paso = signal<1 | 2>(1);
  protected readonly catalogo = injectQuery(() =>
    this.queries.catalogo(
      this.origen(),
      ((!this.id() && this.paso() === 2) ||
        (!!this.id() && this.rol.isSuccess() && !this.rol.data()?.sistema)) &&
        this.tieneCatalogo() &&
        this.access.puede(PERMISOS.ROLES.ASIGNAR_PERMISOS),
    ),
  );
  protected readonly crear = injectMutation(() => this.mutations.crear());
  protected readonly actualizar = injectMutation(() => this.mutations.actualizar());
  protected readonly asignar = injectMutation(() => this.mutations.asignarPermisos());
  protected readonly nombre = signal('');
  protected readonly descripcion = signal('');
  protected readonly activo = signal(true);
  protected readonly selected = signal<readonly string[]>([]);
  protected readonly message = signal(
    typeof this.navigationMessage === 'string' ? this.navigationMessage : '',
  );
  protected readonly error = signal('');
  private initializedFor = '';
  protected readonly puedeAdministrarActual = computed(() =>
    (this.rol.data()?.permisos ?? []).every((permiso) => this.posee(permiso.codigo)),
  );

  constructor() {
    effect(() => {
      const rol = this.rol.data();
      if (!rol || rol.id !== this.id() || this.initializedFor === rol.id) return;
      this.initializedFor = rol.id;
      this.nombre.set(rol.nombre);
      this.descripcion.set(rol.descripcion ?? '');
      this.activo.set(rol.activo);
      this.selected.set(rol.permisos.map((permiso) => permiso.id));
    });
  }
  protected posee(codigo: string) {
    return this.access.perfil.data()?.permisos.includes(codigo) ?? false;
  }
  protected toggle(id: string, checked: boolean) {
    this.selected.update((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((value) => value !== id),
    );
  }
  protected back() {
    return this.access.puede(PERMISOS.ROLES.LEER) ? '/admin/roles-permisos' : '/admin';
  }
  protected siguiente() {
    if (this.crear.isPending()) return;
    if (!this.nombre().trim()) {
      this.error.set('Ingresa un nombre para el rol.');
      return;
    }
    this.error.set('');
    this.paso.set(2);
  }
  protected guardarDatos() {
    const editing = !!this.id();
    if (!editing && this.paso() === 1) {
      this.siguiente();
      return;
    }
    if (
      !this.nombre().trim() ||
      this.crear.isPending() ||
      this.actualizar.isPending() ||
      !this.access.puede(editing ? PERMISOS.ROLES.EDITAR : PERMISOS.ROLES.CREAR) ||
      (editing && (this.rol.data()?.sistema || !this.puedeAdministrarActual()))
    ) {
      if (!this.nombre().trim()) this.error.set('Ingresa un nombre para el rol.');
      return;
    }
    if (!editing) {
      const canAssign = this.access.puede(PERMISOS.ROLES.ASIGNAR_PERMISOS);
      if (canAssign && this.tieneCatalogo() && !this.catalogo.isSuccess()) {
        this.error.set('Espera a que se cargue el catálogo de permisos.');
        return;
      }
      const catalogo = this.catalogo.data()?.flatMap((grupo) => grupo.permisos) ?? [];
      if (
        this.selected().length &&
        (!canAssign ||
          !this.tieneCatalogo() ||
          !this.catalogo.isSuccess() ||
          this.selected().some((id) => !catalogo.some((p) => p.id === id && this.posee(p.codigo))))
      ) {
        this.error.set(
          'Revisa los permisos seleccionados: ya no están disponibles para tu cuenta.',
        );
        return;
      }
    }
    this.error.set('');
    this.message.set('');
    const datos = {
      nombre: this.nombre().trim(),
      descripcion: this.descripcion().trim() || null,
      activo: this.activo(),
    };
    const version = this.auth.sessionVersion;
    if (editing) {
      this.actualizar.mutate(
        { id: this.id(), datos },
        {
          onSuccess: () => {
            if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
              this.message.set('Datos del rol actualizados.');
          },
          onError: (error) => {
            if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
              this.error.set(this.mensaje(error));
          },
        },
      );
    } else {
      this.crear.mutate(
        { ...datos, permisoIds: [...this.selected()] },
        {
          onSuccess: (rol) => {
            if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
              void this.router.navigate(
                [
                  this.access.puede(PERMISOS.ROLES.LEER)
                    ? `/admin/roles-permisos/${rol.id}`
                    : '/admin',
                ],
                { state: { rolMessage: 'Rol creado correctamente.' } },
              );
          },
          onError: (error) => {
            if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
              this.error.set(this.mensaje(error));
          },
        },
      );
    }
  }
  protected guardarPermisos() {
    if (
      !this.id() ||
      this.rol.data()?.sistema ||
      !this.puedeAdministrarActual() ||
      !this.access.puede(PERMISOS.ROLES.ASIGNAR_PERMISOS) ||
      this.asignar.isPending()
    )
      return;
    this.error.set('');
    this.message.set('');
    const version = this.auth.sessionVersion;
    this.asignar.mutate(
      { id: this.id(), permisoIds: [...this.selected()] },
      {
        onSuccess: (rol) => {
          if (!this.destroyRef.destroyed && version === this.auth.sessionVersion) {
            this.selected.set(rol.permisos.map((permiso) => permiso.id));
            this.message.set('Permisos actualizados.');
          }
        },
        onError: (error) => {
          if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
            this.error.set(this.mensaje(error));
        },
      },
    );
  }
  private mensaje(error: unknown) {
    if (error instanceof HttpErrorResponse && error.status === 409)
      return 'El nombre ya existe o el rol está protegido y no puede modificarse.';
    return apiErrorMessage(error, 'No se pudo guardar. Revisa los datos e inténtalo nuevamente.');
  }
}
