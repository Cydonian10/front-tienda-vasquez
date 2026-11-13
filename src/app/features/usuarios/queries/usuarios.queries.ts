import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { httpQuery } from '@/core/query/http-query';
import { UsuariosApi } from '../api/usuarios.api';
import { usuariosKeys } from './usuarios.keys';

@Injectable({ providedIn: 'root' })
export class UsuariosQueries {
  private readonly api = inject(UsuariosApi);
  private readonly retry = (count: number, error: Error) =>
    !(error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) && count < 1;

  listar() {
    return queryOptions({
      queryKey: usuariosKeys.lista,
      queryFn: ({ signal }) => httpQuery(this.api.listar(), signal),
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  obtener(id: string) {
    return queryOptions({
      queryKey: usuariosKeys.detalle(id),
      queryFn: ({ signal }) => httpQuery(this.api.obtener(id), signal),
      enabled: !!id,
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  roles(id: string) {
    return queryOptions({
      queryKey: usuariosKeys.roles(id),
      queryFn: ({ signal }) => httpQuery(this.api.roles(id), signal),
      enabled: !!id,
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  rolesCatalogo(enabled: boolean) {
    return queryOptions({
      queryKey: usuariosKeys.rolesCatalogo,
      queryFn: ({ signal }) => httpQuery(this.api.catalogoRoles(), signal),
      enabled,
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  personas(page: number, nombre: string, enabled: boolean) {
    return queryOptions({
      queryKey: usuariosKeys.personas(page, nombre),
      queryFn: ({ signal }) => httpQuery(this.api.buscarPersonas(page, nombre), signal),
      enabled,
      staleTime: 30_000,
      retry: this.retry,
    });
  }
  persona(id: string, enabled: boolean) {
    return queryOptions({
      queryKey: usuariosKeys.persona(id),
      queryFn: ({ signal }) => httpQuery(this.api.persona(id), signal),
      enabled: !!id && enabled,
      staleTime: 30_000,
      retry: this.retry,
    });
  }
}
