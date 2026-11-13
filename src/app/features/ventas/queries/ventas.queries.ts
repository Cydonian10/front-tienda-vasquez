import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { ventasKeys } from './ventas.keys';
import { VentasApi } from '../api/ventas.api';
@Injectable({ providedIn: 'root' })
export class VentasQueries {
  private readonly api = inject(VentasApi);
  listar(inicio: string, fin: string, page: number) {
    return queryOptions({
      queryKey: ventasKeys.lista(inicio, fin, page),
      queryFn: ({ signal }) => httpQuery(this.api.listar(inicio, fin, page), signal),
      retry: 1,
    });
  }
  productos(page: number, nombre: string, categoriaId: string) {
    return queryOptions({
      queryKey: ventasKeys.productosLista(page, nombre, categoriaId),
      queryFn: ({ signal }) => httpQuery(this.api.productos(page, nombre, categoriaId), signal),
      retry: 1,
    });
  }
  categorias() {
    return queryOptions({
      queryKey: ventasKeys.categorias,
      queryFn: async ({ signal }) => {
        const items: { id: string; nombre: string }[] = [];
        let page = 1,
          totalPages = 1;
        while (page <= totalPages) {
          const data = await httpQuery(this.api.categorias(page++), signal);
          items.push(...data.items);
          totalPages = data.totalPages;
        }
        return items;
      },
      staleTime: 60_000,
      retry: 1,
    });
  }
  ticket(id: string) {
    return queryOptions({
      queryKey: ['ventas', 'ticket', id],
      enabled: !!id,
      queryFn: ({ signal }) => httpQuery(this.api.ticket(id), signal),
      retry: false,
    });
  }
  producto(id: string) {
    return queryOptions({
      queryKey: ventasKeys.productoDetalle(id),
      enabled: !!id,
      queryFn: ({ signal }) => httpQuery(this.api.producto(id), signal),
      retry: false,
    });
  }
  personas(nombre: string, page: number) {
    return queryOptions({
      queryKey: ventasKeys.personas(nombre, page),
      queryFn: ({ signal }) => httpQuery(this.api.personas(nombre, page), signal),
      retry: 1,
    });
  }
  unidades() {
    return queryOptions({
      queryKey: ventasKeys.unidades,
      queryFn: async ({ signal }) => {
        const items: { id: string; nombre: string }[] = [];
        let page = 1,
          totalPages = 1;
        while (page <= totalPages) {
          const data = await httpQuery(this.api.unidades(page++), signal);
          items.push(...data.items);
          totalPages = data.totalPages;
        }
        return items;
      },
      staleTime: 60_000,
    });
  }
}
