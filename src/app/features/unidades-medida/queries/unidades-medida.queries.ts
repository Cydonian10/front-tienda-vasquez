import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { UnidadesMedidaApi } from '../api/unidades-medida.api';
import { unidadesMedidaKeys } from './unidades-medida.keys';
@Injectable({ providedIn: 'root' })
export class UnidadesMedidaQueries {
  private readonly api = inject(UnidadesMedidaApi);
  listar(page: number, limit: number, nombre: string) {
    return queryOptions({
      queryKey: unidadesMedidaKeys.list(page, limit, nombre),
      queryFn: ({ signal }) => httpQuery(this.api.listar(page, limit, nombre), signal),
      staleTime: 60_000,
      retry: 1,
    });
  }
  obtener(id: string) {
    return queryOptions({
      queryKey: unidadesMedidaKeys.detail(id),
      queryFn: ({ signal }) => httpQuery(this.api.obtener(id), signal),
      enabled: !!id,
      staleTime: 60_000,
      retry: (failures, error) =>
        !(error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) &&
        failures < 1,
    });
  }
}
