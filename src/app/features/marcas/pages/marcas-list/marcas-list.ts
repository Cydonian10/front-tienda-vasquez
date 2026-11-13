import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideTag,
  LucideTagPlus,
  LucideTrash2,
} from '@lucide/angular';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { Pagination } from '@/shared/components/pagination/pagination';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Marca } from '../../models/marca.model';
import { MarcasQueries } from '../../queries/marcas.queries';
import { MarcasMutations } from '../../queries/marcas.mutations';

@Component({
  selector: 'app-marcas-list',
  imports: [
    RouterLink,
    Pagination,
    DataTable,
    LucidePencil,
    LucidePlus,
    LucideSearch,
    LucideTag,
    LucideTagPlus,
    LucideTrash2,
  ],
  templateUrl: './marcas-list.html',
})
export class MarcasListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(MarcasQueries);
  private readonly mutations = inject(MarcasMutations);
  private readonly auth = inject(AuthService);
  private readonly changes = new Subject<string>();
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly marcas = injectQuery(() =>
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
      const result = this.marcas.data();
      if (result && result.page === this.page() && this.page() > Math.max(1, result.totalPages))
        this.page.set(Math.max(1, result.totalPages));
    });
  }
  protected buscar(event: Event) {
    this.changes.next((event.target as HTMLInputElement).value);
  }
  protected listError() {
    return apiErrorMessage(this.marcas.error(), 'No se pudo cargar el listado de marcas.');
  }
  protected borrar(marca: Marca) {
    if (
      !this.access.puede(PERMISOS.MARCAS.ELIMINAR) ||
      this.eliminar.isPending() ||
      !window.confirm(`¿Eliminar la marca «${marca.nombre}»?`)
    )
      return;
    this.error.set('');
    this.message.set('');
    const version = this.auth.sessionVersion;
    this.eliminar.mutate(marca.id, {
      onSuccess: () => {
        if (version === this.auth.sessionVersion)
          this.message.set('Marca eliminada correctamente.');
      },
      onError: (error) => {
        if (version === this.auth.sessionVersion)
          this.error.set(apiErrorMessage(error, 'No se pudo eliminar la marca.'));
      },
    });
  }
}
