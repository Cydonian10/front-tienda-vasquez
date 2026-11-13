import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const empresaRoutes: Routes = [
  {
    path: '',
    title: 'Empresa · Tienda Vasquez',
    data: { label: 'Empresa' },
    canActivate: [requirePermissions(PERMISOS.EMPRESA.LEER)],
    loadComponent: () =>
      import('@/features/empresa/pages/empresa/empresa').then((m) => m.EmpresaPage),
  },
];
