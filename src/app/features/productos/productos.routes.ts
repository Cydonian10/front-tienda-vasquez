import { Routes } from '@angular/router';
import { requirePermissions } from '@/core/access-control/permission.guard';
import { PERMISOS } from '@/core/access-control/permissions';

export const productosRoutes: Routes = [
  {
    path: ':id/editar',
    title: 'Editar producto · Tienda Vasquez',
    canActivate: [
      requirePermissions(
        PERMISOS.PRODUCTOS.LEER,
        PERMISOS.PRODUCTOS.EDITAR,
        PERMISOS.MARCAS.LEER,
        PERMISOS.CATEGORIAS.LEER,
        PERMISOS.UNIDADES_MEDIDA.LEER,
      ),
    ],
    loadComponent: () =>
      import('./pages/producto-create/producto-create').then((m) => m.ProductoCreatePage),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Productos · Tienda Vasquez',
    canActivate: [requirePermissions(PERMISOS.PRODUCTOS.LEER)],
    loadComponent: () =>
      import('./pages/productos-list/productos-list').then((m) => m.ProductosListPage),
  },
  {
    path: 'nuevo',
    title: 'Nuevo producto · Tienda Vasquez',
    canActivate: [
      requirePermissions(
        PERMISOS.PRODUCTOS.CREAR,
        PERMISOS.MARCAS.LEER,
        PERMISOS.CATEGORIAS.LEER,
        PERMISOS.UNIDADES_MEDIDA.LEER,
      ),
    ],
    loadComponent: () =>
      import('./pages/producto-create/producto-create').then((m) => m.ProductoCreatePage),
  },
];
