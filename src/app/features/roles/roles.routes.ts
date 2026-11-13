import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const rolesRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Roles y permisos · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.ROLES.LEER)],
    loadComponent: () => import('./pages/roles-list/roles-list').then((m) => m.RolesListPage),
  },
  {
    path: 'nuevo',
    title: 'Nuevo rol · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.ROLES.CREAR)],
    loadComponent: () => import('./pages/rol-form/rol-form').then((m) => m.RolFormPage),
  },
  {
    path: ':id',
    title: 'Detalle del rol · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.ROLES.LEER)],
    loadComponent: () => import('./pages/rol-form/rol-form').then((m) => m.RolFormPage),
  },
];
