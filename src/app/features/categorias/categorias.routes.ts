import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';
export const categoriasRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Categorías · Tienda Vasquez',
    data: { label: 'Categorías' },
    canActivate: [requirePermissions(PERMISOS.CATEGORIAS.LEER)],
    loadComponent: () => import('./pages/categorias-list/categorias-list').then((m) => m.CategoriasListPage),
  },
  {
    path: 'nueva',
    title: 'Nueva categoría · Tienda Vasquez',
    data: { label: 'Nueva categoría' },
    canActivate: [requirePermissions(PERMISOS.CATEGORIAS.CREAR)],
    loadComponent: () => import('./pages/categoria-form-page/categoria-form-page').then((m) => m.CategoriaFormPage),
  },
  {
    path: ':id/editar',
    title: 'Editar categoría · Tienda Vasquez',
    data: { label: 'Editar categoría' },
    canActivate: [requirePermissions(PERMISOS.CATEGORIAS.LEER, PERMISOS.CATEGORIAS.EDITAR)],
    loadComponent: () => import('./pages/categoria-form-page/categoria-form-page').then((m) => m.CategoriaFormPage),
  },
];
