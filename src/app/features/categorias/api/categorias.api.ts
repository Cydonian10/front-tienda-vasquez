import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Categoria, CategoriaDatos, PaginaCategorias } from '../models/categoria.model';
@Injectable({ providedIn: 'root' })
export class CategoriasApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;
  listar(page: number, limit: number, nombre: string) {
    return this.http.get<PaginaCategorias>(this.url, {
      params: { page, limit, ...(nombre ? { nombre } : {}) },
    });
  }
  obtener(id: string) {
    return this.http.get<Categoria>(`${this.url}/${encodeURIComponent(id)}`);
  }
  crear(datos: CategoriaDatos) {
    return this.http.post<Categoria>(this.url, datos);
  }
  actualizar(id: string, datos: CategoriaDatos) {
    return this.http.put<Categoria>(`${this.url}/${encodeURIComponent(id)}`, datos);
  }
  eliminar(id: string) {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
