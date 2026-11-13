import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const usuariosRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Usuarios · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.USUARIOS.LEER)],
    loadComponent: () =>
      import('./pages/usuarios-list/usuarios-list').then((m) => m.UsuariosListPage),
  },
  {
    path: 'nuevo',
    title: 'Nuevo usuario · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.USUARIOS.CREAR)],
    loadComponent: () => import('./pages/usuario-form/usuario-form').then((m) => m.UsuarioFormPage),
  },
  {
    path: ':id/editar',
    title: 'Editar usuario · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.USUARIOS.LEER, PERMISOS.USUARIOS.EDITAR)],
    loadComponent: () => import('./pages/usuario-form/usuario-form').then((m) => m.UsuarioFormPage),
  },
];
