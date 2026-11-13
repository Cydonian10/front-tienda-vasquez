import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import {
  LucideArrowRight,
  LucideLockKeyhole,
  LucidePlus,
  LucideSearch,
  LucideShield,
  LucideShieldCheck,
  LucideTrash2,
} from '@lucide/angular';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { Pagination } from '@/shared/components/pagination/pagination';
import { Rol } from '../../models/rol.model';
import { RolesMutations } from '../../queries/roles.mutations';
import { rolesKeys } from '../../queries/roles.keys';
import { RolesQueries } from '../../queries/roles.queries';
import { EliminarRolDialog } from './eliminar-rol-dialog';

@Component({
  selector: 'app-roles-list',
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideLockKeyhole,
    LucidePlus,
    LucideSearch,
    LucideShield,
    LucideShieldCheck,
    LucideTrash2,
    Pagination,
  ],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.css',
})
export class RolesListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(RolesQueries);
  private readonly mutations = inject(RolesMutations);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  private confirmacion?: DialogRef<boolean>;
  protected readonly roles = injectQuery(() => this.queries.listar());
  protected readonly eliminar = injectMutation(() => this.mutations.eliminar());
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly hayBusqueda = computed(() => this.search().trim().length > 0);
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly filtrados = computed(() => {
    const text = this.search().trim().toLocaleLowerCase();
    return (this.roles.data() ?? []).filter((rol) =>
      `${rol.nombre} ${rol.descripcion ?? ''}`.toLocaleLowerCase().includes(text),
    );
  });
  protected readonly visibles = computed(() =>
    this.filtrados().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize),
  );

  constructor() {
    this.auth.sessionCleared.pipe(takeUntilDestroyed()).subscribe(() => this.confirmacion?.close());
    this.destroyRef.onDestroy(() => this.confirmacion?.close());
    effect(() => {
      const lastPage = Math.max(1, Math.ceil(this.filtrados().length / this.pageSize));
      if (this.page() > lastPage) this.page.set(lastPage);
    });
  }

  protected buscar(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected confirmarEliminar(rol: Rol) {
    if (
      rol.sistema ||
      !this.access.puede(PERMISOS.ROLES.ELIMINAR) ||
      this.eliminar.isPending() ||
      this.confirmacion
    )
      return;
    this.error.set('');
    this.message.set('');
    const version = this.auth.sessionVersion;
    const ref = this.dialog.open<boolean, { nombre: string }>(EliminarRolDialog, {
      data: { nombre: rol.nombre },
      role: 'alertdialog',
      ariaLabelledBy: 'eliminar-rol-title',
      ariaDescribedBy: 'eliminar-rol-description',
      autoFocus: '#cancelar-eliminar-rol',
      backdropClass: 'person-dialog-backdrop',
    });
    this.confirmacion = ref;
    ref.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      this.confirmacion = undefined;
      const actual = this.client
        .getQueryData<Rol[]>(rolesKeys.lista)
        ?.find((item) => item.id === rol.id);
      if (
        !confirmed ||
        this.destroyRef.destroyed ||
        version !== this.auth.sessionVersion ||
        !actual ||
        actual.sistema ||
        !this.access.puede(PERMISOS.ROLES.ELIMINAR) ||
        this.eliminar.isPending()
      )
        return;
      this.eliminar.mutate(actual.id, {
        onSuccess: () => {
          if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
            this.message.set(`El rol «${actual.nombre}» se eliminó correctamente.`);
        },
        onError: (error) => {
          if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) return;
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.error.set(
              'No se pudo eliminar el rol: está asignado a usuarios o está protegido.',
            );
          } else if (error instanceof HttpErrorResponse && error.status === 403) {
            this.error.set(
              'No tienes permiso para eliminar este rol o no posees todos sus permisos.',
            );
          } else if (error instanceof HttpErrorResponse && error.status === 404) {
            this.error.set('El rol ya no existe. Actualiza el listado para ver los cambios.');
          } else {
            this.error.set(
              apiErrorMessage(error, 'No se pudo eliminar el rol. Inténtalo nuevamente.'),
            );
          }
        },
      });
    });
  }
}
