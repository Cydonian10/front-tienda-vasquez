import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { LucideBox, LucidePlus, LucideSearch } from '@lucide/angular';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { apiErrorMessage } from '@/core/errors/api-error';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Pagination } from '@/shared/components/pagination/pagination';
import { NumeroDecimalPipe } from '@/shared/pipes/numero-decimal.pipe';
import { ProductosQueries } from '../../queries/productos.queries';

@Component({
  selector: 'app-productos-list',
  imports: [
    RouterLink,
    DataTable,
    Pagination,
    LucideBox,
    LucidePlus,
    LucideSearch,
    NumeroDecimalPipe,
  ],
  templateUrl: './productos-list.html',
})
export class ProductosListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(ProductosQueries);
  private readonly changes = new Subject<string>();
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly nombre = signal('');
  protected readonly productos = injectQuery(() => this.queries.listar(this.page(), this.nombre()));
  constructor() {
    this.changes
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.page.set(1);
        this.nombre.set(value.trim());
      });
    effect(() => {
      const result = this.productos.data();
      if (result && result.page === this.page() && this.page() > Math.max(1, result.totalPages))
        this.page.set(Math.max(1, result.totalPages));
    });
  }
  protected buscar(event: Event) {
    this.changes.next((event.target as HTMLInputElement).value);
  }
  protected listError() {
    return apiErrorMessage(this.productos.error(), 'No se pudo cargar el listado de productos.');
  }
}
