import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideLayers,
  LucideFolderPlus,
  LucideTrash2,
} from '@lucide/angular';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { Pagination } from '@/shared/components/pagination/pagination';
import { DataTable } from '@/shared/components/data-table/data-table';
import { UnidadMedida } from '../../models/unidad-medida.model';
import { UnidadesMedidaQueries } from '../../queries/unidades-medida.queries';
import { UnidadesMedidaMutations } from '../../queries/unidades-medida.mutations';
@Component({
  selector: 'app-unidades-medida-list',
  imports: [
    RouterLink,
    Pagination,
    DataTable,
    LucidePencil,
    LucidePlus,
    LucideSearch,
    LucideLayers,
    LucideFolderPlus,
    LucideTrash2,
  ],
  templateUrl: './unidades-medida-list.html',
})
export class UnidadesMedidaListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(UnidadesMedidaQueries);
  private readonly mutations = inject(UnidadesMedidaMutations);
  private readonly auth = inject(AuthService);
  private readonly changes = new Subject<string>();
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly unidadesMedida = injectQuery(() =>
    this.queries.listar(this.page(), this.pageSize, this.search()),
  );
  protected readonly eliminar = injectMutation(() => this.mutations.eliminar());
  constructor() {
    this.changes
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.page.set(1);
        this.search.set(value.trim());
      });
    effect(() => {
      const result = this.unidadesMedida.data();
      if (result && result.page === this.page() && this.page() > Math.max(1, result.totalPages))
        this.page.set(Math.max(1, result.totalPages));
    });
  }
  protected buscar(event: Event) {
    this.changes.next((event.target as HTMLInputElement).value);
  }
  protected listError() {
    return apiErrorMessage(this.unidadesMedida.error(), 'No se pudo cargar el listado de unidades de medida.');
  }
  protected borrar(unidadMedida: UnidadMedida) {
    if (
      !this.access.puede(PERMISOS.UNIDADES_MEDIDA.ELIMINAR) ||
      this.eliminar.isPending() ||
      !window.confirm(`¿Eliminar la unidad de medida «${unidadMedida.nombre}»?`)
    )
      return;
    this.error.set('');
    this.message.set('');
    const version = this.auth.sessionVersion;
    this.eliminar.mutate(unidadMedida.id, {
      onSuccess: () => {
        if (version === this.auth.sessionVersion)
          this.message.set('Unidad de medida eliminada correctamente.');
      },
      onError: (error) => {
        if (version === this.auth.sessionVersion)
          this.error.set(apiErrorMessage(error, 'No se pudo eliminar la unidad de medida.'));
      },
    });
  }
}
