import { Routes } from '@angular/router';
import { authGuard } from '@/core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },
  {
    path: '',
    loadChildren: () => import('@/features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'admin',
    title: 'Administración · Tienda Vasquez',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('@/layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    loadChildren: () => import('@/layouts/admin-layout/admin.routes').then((m) => m.adminRoutes),
  },
  { path: '**', redirectTo: 'admin' },
];
