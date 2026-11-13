import { inject, provideAppInitializer } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';

/** Integra sesión y caché sin introducir TanStack en autenticación. */
export function provideSessionQueryCache() {
  return provideAppInitializer(() => {
    const auth = inject(AuthService);
    const queryClient = inject(QueryClient);
    auth.sessionCleared.pipe(takeUntilDestroyed()).subscribe(() => {
      void queryClient.cancelQueries();
      queryClient.clear();
    });
  });
}
