import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { withDevtools } from '@tanstack/angular-query-experimental/devtools';

import { routes } from './app.routes';
import { authInterceptor } from '@/core/auth/auth.interceptor';
import { provideSessionQueryCache } from '@/core/query/session-query-cache';
import { permissionInterceptor } from '@/core/access-control/permission.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, permissionInterceptor])),
    provideTanStackQuery(new QueryClient(), withDevtools()),
    provideSessionQueryCache(),
    provideRouter(routes),
  ],
};
