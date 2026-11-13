import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { ProductosApi } from '../api/productos.api';
@Injectable({ providedIn: 'root' })
export class ProductosQueries {
  private readonly api = inject(ProductosApi);

  obtener(id: string) {
    return queryOptions({
      queryKey: ['productos', 'detalle', id],
      queryFn: ({ signal }) => httpQuery(this.api.obtener(id), signal),
      enabled: !!id,
      retry: false,
    });
  }
  catalogo(tipo: 'marcas' | 'categorias' | 'unidades-medida') {
    return queryOptions({
      queryKey: ['productos', 'catalogo', tipo],
      queryFn: async ({ signal }) => {
        const items: { id: string; nombre: string }[] = [];
        let page = 1;
        let totalPages = 1;
        while (page <= totalPages) {
          const result = await httpQuery(this.api.catalogo(tipo, page), signal);
          items.push(...result.items);
          totalPages = result.totalPages;
          page++;
        }
        return items;
      },
      staleTime: 60_000,
      retry: 1,
    });
  }
  listar(page: number, nombre: string) {
    return queryOptions({
      queryKey: ['productos', 'lista', page, nombre],
      queryFn: ({ signal }) => httpQuery(this.api.listar(page, nombre), signal),
      retry: 1,
    });
  }
}
