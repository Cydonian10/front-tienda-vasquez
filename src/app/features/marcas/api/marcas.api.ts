import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Marca, MarcaDatos, PaginaMarcas } from '../models/marca.model';

@Injectable({ providedIn: 'root' })
export class MarcasApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/marcas`;
  listar(page: number, limit: number, nombre: string) {
    return this.http.get<PaginaMarcas>(this.url, {
      params: { page, limit, ...(nombre ? { nombre } : {}) },
    });
  }
  obtener(id: string) {
    return this.http.get<Marca>(`${this.url}/${encodeURIComponent(id)}`);
  }
  crear(datos: MarcaDatos) {
    return this.http.post<Marca>(this.url, datos);
  }
  actualizar(id: string, datos: MarcaDatos) {
    return this.http.put<Marca>(`${this.url}/${encodeURIComponent(id)}`, datos);
  }
  eliminar(id: string) {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
