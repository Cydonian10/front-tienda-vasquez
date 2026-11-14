import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { LucideShoppingCart } from '@lucide/angular';
import { httpQuery } from '@/core/query/http-query';
import { environment } from '../../../environments/environment';

interface VentaReciente { id: string; fecha: string; total: string; modalidad: string; cliente: string | null; medio: string | null; }
interface ProductoVendido { id: string; nombre: string; unidad: string; cantidad: string; }
@Component({
  selector: 'app-actividad-reciente',
  imports: [RouterLink, LucideShoppingCart],
  styleUrl: './actividad-reciente.css',
  templateUrl: './actividad-reciente.html',
})
export class ActividadReciente {
  private readonly http = inject(HttpClient);
  protected readonly ventas = injectQuery(() => ({
    queryKey: ['inicio', 'ventas', 'recientes'],
    queryFn: ({ signal }) => httpQuery(this.http.get<VentaReciente[]>(`${environment.apiUrl}/inicio/ventas-recientes`), signal),
  }));
  protected readonly productos = injectQuery(() => ({
    queryKey: ['inicio', 'ventas', 'mas-vendidos'],
    queryFn: ({ signal }) => httpQuery(this.http.get<ProductoVendido[]>(`${environment.apiUrl}/inicio/productos-mas-vendidos`), signal),
  }));
  protected fecha(valor: string) { return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Lima' }).format(new Date(valor)); }
  protected dinero(valor: string) { return Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  protected cantidad(valor: string) { return Number(valor).toLocaleString('es-PE', { maximumFractionDigits: 4 }); }
}
