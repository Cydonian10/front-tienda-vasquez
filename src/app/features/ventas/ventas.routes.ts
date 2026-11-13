import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const ventasRoutes: Routes = [
  {
    path: 'nueva',
    title: 'Nueva venta · Tienda Vasquez',
    canActivate: [
      requirePermissions(
        PERMISOS.VENTAS.CREAR,
        PERMISOS.PRODUCTOS.LEER,
        PERMISOS.UNIDADES_MEDIDA.LEER,
      ),
    ],
    loadComponent: () => import('./pages/punto-venta/punto-venta').then((m) => m.PuntoVenta),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Ventas · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.VENTAS.LEER)],
    loadComponent: () => import('./pages/ventas-list/ventas-list').then((m) => m.VentasList),
  },
];
