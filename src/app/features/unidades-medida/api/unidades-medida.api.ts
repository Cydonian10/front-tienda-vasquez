import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { UnidadMedida, UnidadMedidaDatos, PaginaUnidadesMedida } from '../models/unidad-medida.model';
@Injectable({ providedIn: 'root' })
export class UnidadesMedidaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/unidades-medida`;
  listar(page: number, limit: number, nombre: string) {
    return this.http.get<PaginaUnidadesMedida>(this.url, {
      params: { page, limit, ...(nombre ? { nombre } : {}) },
    });
  }
  obtener(id: string) {
    return this.http.get<UnidadMedida>(`${this.url}/${encodeURIComponent(id)}`);
  }
  crear(datos: UnidadMedidaDatos) {
    return this.http.post<UnidadMedida>(this.url, datos);
  }
  actualizar(id: string, datos: UnidadMedidaDatos) {
    return this.http.put<UnidadMedida>(`${this.url}/${encodeURIComponent(id)}`, datos);
  }
  eliminar(id: string) {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
}
