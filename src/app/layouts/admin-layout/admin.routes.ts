import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Inicio · Tienda Vasquez', loadComponent: () => import('@/features/inicio/dashboard').then(m => m.Dashboard) },
  {
    path: 'ventas',
    loadChildren: () => import('@/features/ventas/ventas.routes').then((m) => m.ventasRoutes),
  },
  { path: 'productos', loadChildren: () => import('@/features/productos/productos.routes').then(m => m.productosRoutes) },
  {
    path: 'acceso',
    title: 'Acceso · Tienda Vasquez',
    loadComponent: () => import('./acceso-page').then((m) => m.AccesoPage),
  },
  {
    path: 'empresa',
    loadChildren: () => import('@/features/empresa/empresa.routes').then((m) => m.empresaRoutes),
  },
  {
    path: 'personas',
    loadChildren: () => import('@/features/personas/personas.routes').then((m) => m.personasRoutes),
  },
  {
    path: 'marcas',
    loadChildren: () => import('@/features/marcas/marcas.routes').then((m) => m.marcasRoutes),
  },
  {
    path: 'categorias',
    loadChildren: () =>
      import('@/features/categorias/categorias.routes').then((m) => m.categoriasRoutes),
  },
  {
    path: 'unidades-medida',
    loadChildren: () => import('@/features/unidades-medida/unidades-medida.routes').then((m) => m.unidadesMedidaRoutes),
  },
  {
    path: 'usuarios',
    loadChildren: () => import('@/features/usuarios/usuarios.routes').then((m) => m.usuariosRoutes),
  },
  {
    path: 'roles-permisos',
    loadChildren: () => import('@/features/roles/roles.routes').then((m) => m.rolesRoutes),
  },
];
