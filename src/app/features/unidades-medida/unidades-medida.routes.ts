import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';
export const unidadesMedidaRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Unidades de medida · Tienda Vasquez',
    data: { label: 'Unidades de medida' },
    canActivate: [requirePermissions(PERMISOS.UNIDADES_MEDIDA.LEER)],
    loadComponent: () => import('./pages/unidades-medida-list/unidades-medida-list').then((m) => m.UnidadesMedidaListPage),
  },
  {
    path: 'nueva',
    title: 'Nueva unidad de medida · Tienda Vasquez',
    data: { label: 'Nueva unidad de medida' },
    canActivate: [requirePermissions(PERMISOS.UNIDADES_MEDIDA.CREAR)],
    loadComponent: () => import('./pages/unidad-medida-form-page/unidad-medida-form-page').then((m) => m.UnidadMedidaFormPage),
  },
  {
    path: ':id/editar',
    title: 'Editar unidad de medida · Tienda Vasquez',
    data: { label: 'Editar unidad de medida' },
    canActivate: [requirePermissions(PERMISOS.UNIDADES_MEDIDA.LEER, PERMISOS.UNIDADES_MEDIDA.EDITAR)],
    loadComponent: () => import('./pages/unidad-medida-form-page/unidad-medida-form-page').then((m) => m.UnidadMedidaFormPage),
  },
];
