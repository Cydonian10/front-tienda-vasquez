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
import { Categoria } from '../../models/categoria.model';
import { CategoriasQueries } from '../../queries/categorias.queries';
import { CategoriasMutations } from '../../queries/categorias.mutations';
@Component({
  selector: 'app-categorias-list',
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
  templateUrl: './categorias-list.html',
})
export class CategoriasListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(CategoriasQueries);
  private readonly mutations = inject(CategoriasMutations);
  private readonly auth = inject(AuthService);
  private readonly changes = new Subject<string>();
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly categorias = injectQuery(() =>
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
      const result = this.categorias.data();
      if (result && result.page === this.page() && this.page() > Math.max(1, result.totalPages))
        this.page.set(Math.max(1, result.totalPages));
    });
  }
  protected buscar(event: Event) {
    this.changes.next((event.target as HTMLInputElement).value);
  }
  protected listError() {
    return apiErrorMessage(this.categorias.error(), 'No se pudo cargar el listado de categorías.');
  }
  protected borrar(categoria: Categoria) {
    if (
      !this.access.puede(PERMISOS.CATEGORIAS.ELIMINAR) ||
      this.eliminar.isPending() ||
      !window.confirm(`¿Eliminar la categoría «${categoria.nombre}»?`)
    )
      return;
    this.error.set('');
    this.message.set('');
    const version = this.auth.sessionVersion;
    this.eliminar.mutate(categoria.id, {
      onSuccess: () => {
        if (version === this.auth.sessionVersion)
          this.message.set('Categoría eliminada correctamente.');
      },
      onError: (error) => {
        if (version === this.auth.sessionVersion)
          this.error.set(apiErrorMessage(error, 'No se pudo eliminar la categoría.'));
      },
    });
  }
}
