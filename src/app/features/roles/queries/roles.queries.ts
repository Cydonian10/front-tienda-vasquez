import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { RolesApi } from '../api/roles.api';
import { rolesKeys } from './roles.keys';

@Injectable({ providedIn: 'root' })
export class RolesQueries {
  private readonly api = inject(RolesApi);
  private readonly retry = (count: number, error: Error) =>
    !(error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) && count < 1;
  listar() {
    return queryOptions({
      queryKey: rolesKeys.lista,
      queryFn: ({ signal }) => httpQuery(this.api.listar(), signal),
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  obtener(id: string) {
    return queryOptions({
      queryKey: rolesKeys.detalle(id),
      queryFn: ({ signal }) => httpQuery(this.api.obtener(id), signal),
      enabled: !!id,
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  catalogo(origen: 'features' | 'permisos', enabled: boolean) {
    return queryOptions({
      queryKey: rolesKeys.catalogo(origen),
      queryFn: ({ signal }) => httpQuery(this.api.catalogo(origen), signal),
      enabled,
      staleTime: 60_000,
      retry: this.retry,
    });
  }
}
