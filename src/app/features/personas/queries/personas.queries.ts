import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { HttpErrorResponse } from '@angular/common/http';
import { httpQuery } from '@/core/query/http-query';
import { PersonasApi } from '@/features/personas/api/personas.api';
import { personasKeys } from './personas.keys';

@Injectable({ providedIn: 'root' })
export class PersonasQueries {
  private readonly api = inject(PersonasApi);

  obtener(id: string) {
    return queryOptions({
      queryKey: personasKeys.detalle(id),
      queryFn: ({ signal }) => httpQuery(this.api.obtener(id), signal),
      enabled: !!id,
      staleTime: 60_000,
      retry: (failures, error) =>
        !(error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) &&
        failures < 1,
    });
  }

  listar(page: number, limit: number, nombre: string) {
    return queryOptions({
      queryKey: personasKeys.listar(page, limit, nombre),
      queryFn: ({ signal }) => httpQuery(this.api.listar(page, limit, nombre), signal),
      staleTime: 60_000,
      retry: 1,
    });
  }
}
