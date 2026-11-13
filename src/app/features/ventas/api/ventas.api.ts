import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  Pagina,
  Persona,
  ProductoDetalle,
  ProductoLista,
  VentaDatos,
  VentaRespuesta,
  TicketVenta,
  VentaLista,
} from '../models/venta.model';
@Injectable({ providedIn: 'root' })
export class VentasApi {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;
  listar(fechaInicio: string, fechaFin: string, page: number) {
    return this.http.get<Pagina<VentaLista>>(`${this.url}/ventas`, {
      params: { fechaInicio, fechaFin, page, limit: 10 },
    });
  }
  productos(page: number, nombre: string, categoriaId: string) {
    return this.http.get<Pagina<ProductoLista>>(`${this.url}/productos`, {
      params: {
        page,
        limit: 12,
        ...(nombre ? { nombre } : {}),
        ...(categoriaId ? { categoriaId } : {}),
      },
    });
  }
  categorias(page: number) {
    return this.http.get<{ items: { id: string; nombre: string }[]; totalPages: number }>(
      `${this.url}/categorias`,
      { params: { page, limit: 100 } },
    );
  }
  producto(id: string) {
    return this.http.get<ProductoDetalle>(`${this.url}/productos/${encodeURIComponent(id)}`);
  }
  unidades(page: number) {
    return this.http.get<{ items: { id: string; nombre: string }[]; totalPages: number }>(
      `${this.url}/unidades-medida`,
      { params: { page, limit: 100 } },
    );
  }
  personas(nombre: string, page: number) {
    return this.http.get<Pagina<Persona>>(`${this.url}/personas`, {
      params: { page, limit: 10, ...(nombre ? { nombre } : {}) },
    });
  }
  ticket(id: string) {
    return this.http.get<TicketVenta>(`${this.url}/ventas/${encodeURIComponent(id)}/ticket`);
  }
  ticketPdf(id: string) {
    return this.http.get(`${this.url}/ventas/${encodeURIComponent(id)}/ticket.pdf`, {
      responseType: 'blob',
    });
  }
  crear(datos: VentaDatos) {
    return this.http.post<VentaRespuesta>(`${this.url}/ventas`, datos);
  }
}
