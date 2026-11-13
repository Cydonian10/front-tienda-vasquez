import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

import { PaginaProductos, ProductoDetalle } from '../models/producto.model';
@Injectable({ providedIn: 'root' })
export class ProductosApi {
  private readonly http = inject(HttpClient);
  catalogo(tipo: 'marcas' | 'categorias' | 'unidades-medida', page: number) {
    return this.http.get<{ items: { id: string; nombre: string }[]; totalPages: number }>(
      `${environment.apiUrl}/${tipo}`,
      { params: { page, limit: 100 } },
    );
  }
  obtener(id: string) {
    return this.http.get<ProductoDetalle>(
      `${environment.apiUrl}/productos/${encodeURIComponent(id)}`,
    );
  }
  actualizar(id: string, data: FormData) {
    return this.http.put<{ id: string }>(
      `${environment.apiUrl}/productos/${encodeURIComponent(id)}`,
      data,
    );
  }
  crear(data: FormData) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/productos`, data);
  }
  listar(page: number, nombre: string) {
    return this.http.get<PaginaProductos>(`${environment.apiUrl}/productos`, {
      params: { page, limit: 10, ...(nombre ? { nombre } : {}) },
    });
  }
}
