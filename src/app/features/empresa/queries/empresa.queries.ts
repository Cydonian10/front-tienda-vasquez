import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { EmpresaApi } from '@/features/empresa/api/empresa.api';
import { empresaKeys } from './empresa.keys';

@Injectable({ providedIn: 'root' })
export class EmpresaQueries {
  private readonly api = inject(EmpresaApi);

  obtener() {
    return queryOptions({
      queryKey: empresaKeys.actual,
      queryFn: ({ signal }) => httpQuery(this.api.obtener(), signal),
      staleTime: 60_000,
      retry: 1,
    });
  }
}
