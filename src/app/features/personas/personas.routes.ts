import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const personasRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Personas · Tienda Vasquez',
    data: { label: 'Personas' },
    canActivate: [requirePermissions(PERMISOS.PERSONAS.LEER)],
    loadComponent: () =>
      import('@/features/personas/pages/personas-list/personas-list').then(
        (m) => m.PersonasListPage,
      ),
  },
  {
    path: 'nueva',
    title: 'Nueva persona · Tienda Vasquez',
    data: { label: 'Nueva persona' },
    canActivate: [requirePermissions(PERMISOS.PERSONAS.CREAR)],
    loadComponent: () =>
      import('@/features/personas/pages/persona-create/persona-create').then(
        (m) => m.PersonaCreatePage,
      ),
  },
  {
    path: ':id/editar',
    title: 'Editar persona · Tienda Vasquez',
    data: { label: 'Editar persona' },
    canActivate: [requirePermissions(PERMISOS.PERSONAS.LEER, PERMISOS.PERSONAS.EDITAR)],
    loadComponent: () =>
      import('@/features/personas/pages/persona-edit/persona-edit').then((m) => m.PersonaEditPage),
  },
];
