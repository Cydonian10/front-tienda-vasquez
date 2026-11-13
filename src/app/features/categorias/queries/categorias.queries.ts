import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { CategoriasApi } from '../api/categorias.api';
import { categoriasKeys } from './categorias.keys';
@Injectable({ providedIn: 'root' })
export class CategoriasQueries {
  private readonly api = inject(CategoriasApi);
  listar(page: number, limit: number, nombre: string) {
    return queryOptions({
      queryKey: categoriasKeys.list(page, limit, nombre),
      queryFn: ({ signal }) => httpQuery(this.api.listar(page, limit, nombre), signal),
      staleTime: 60_000,
      retry: 1,
    });
  }
  obtener(id: string) {
    return queryOptions({
      queryKey: categoriasKeys.detail(id),
      queryFn: ({ signal }) => httpQuery(this.api.obtener(id), signal),
      enabled: !!id,
      staleTime: 60_000,
      retry: (failures, error) =>
        !(error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) &&
        failures < 1,
    });
  }
}
