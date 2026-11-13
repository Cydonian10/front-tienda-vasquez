import { Routes } from '@angular/router';
import { guestGuard } from '@/core/auth/auth.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Tienda Vasquez',
    canActivate: [guestGuard],
    loadComponent: () => import('@/features/auth/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'auth/callback',
    title: 'Conectando con Google · Tienda Vasquez',
    loadComponent: () =>
      import('@/features/auth/auth-callback/auth-callback').then((m) => m.AuthCallbackPage),
  },
];
