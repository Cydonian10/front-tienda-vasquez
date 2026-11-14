import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  LucideBarChart3,
  LucideShoppingCart,
  LucideBox,
  LucideLayoutDashboard,
  LucidePlus,
  LucideCalendarDays,
} from '@lucide/angular';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { httpQuery } from '@/core/query/http-query';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    LucideBarChart3,
    LucideShoppingCart,
    LucideBox,
    LucideLayoutDashboard,
    LucidePlus,
    LucideCalendarDays,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly access = inject(PerfilAccess);
  protected readonly p = PERMISOS;
  private readonly http = inject(HttpClient);
  protected readonly fecha = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'full',
    timeZone: 'America/Lima',
  }).format(new Date());
  protected readonly ventas = injectQuery(() => ({
    queryKey: ['inicio', 'ventas'],
    enabled: this.access.puede(PERMISOS.VENTAS.LEER),
    queryFn: ({ signal }) =>
      httpQuery(
        this.http.get<{ total: string; ventas: number; cantidad: string }>(
          `${environment.apiUrl}/inicio/resumen-ventas`,
        ),
        signal,
      ),
  }));
  protected readonly productos = injectQuery(() => ({
    queryKey: ['inicio', 'productos'],
    enabled: this.access.puede(PERMISOS.PRODUCTOS.LEER),
    queryFn: ({ signal }) =>
      httpQuery(
        this.http.get<{ total: number }>(`${environment.apiUrl}/productos`, {
          params: { page: 1, limit: 1 },
        }),
        signal,
      ),
  }));
  protected get importe() {
    return Number(this.ventas.data()?.total ?? 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  protected get cantidad() {
    return Number(this.ventas.data()?.cantidad ?? 0).toLocaleString('es-PE', {
      maximumFractionDigits: 4,
    });
  }
  protected get nombre() {
    const perfil = this.access.perfil.data();
    return perfil?.persona?.nombres || perfil?.nickname || 'bienvenido';
  }
  protected get puedeCrear() {
    return [PERMISOS.VENTAS.CREAR, PERMISOS.PRODUCTOS.LEER, PERMISOS.UNIDADES_MEDIDA.LEER].every(
      (x) => this.access.puede(x),
    );
  }
}
