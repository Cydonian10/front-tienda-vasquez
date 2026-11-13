import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const marcasRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Marcas · Tienda Vasquez',
    data: { label: 'Marcas' },
    canActivate: [requirePermissions(PERMISOS.MARCAS.LEER)],
    loadComponent: () => import('./pages/marcas-list/marcas-list').then((m) => m.MarcasListPage),
  },
  {
    path: 'nueva',
    title: 'Nueva marca · Tienda Vasquez',
    data: { label: 'Nueva marca' },
    canActivate: [requirePermissions(PERMISOS.MARCAS.CREAR)],
    loadComponent: () => import('./pages/marca-form-page/marca-form-page').then((m) => m.MarcaFormPage),
  },
  {
    path: ':id/editar',
    title: 'Editar marca · Tienda Vasquez',
    data: { label: 'Editar marca' },
    canActivate: [requirePermissions(PERMISOS.MARCAS.LEER, PERMISOS.MARCAS.EDITAR)],
    loadComponent: () => import('./pages/marca-form-page/marca-form-page').then((m) => m.MarcaFormPage),
  },
];
