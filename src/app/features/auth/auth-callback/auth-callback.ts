import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';

@Component({
  selector: 'app-auth-callback',
  imports: [RouterLink],
  template: `
    <main class="grid min-h-screen place-items-center bg-base-100 p-6 text-base-content">
      <section
        class="card w-full max-w-md items-center bg-base-200 p-8 text-center"
        aria-live="polite"
      >
        <span class="mb-5 text-3xl font-bold text-primary">v<span>.</span></span>
        @if (error()) {
          <h1 class="text-2xl font-semibold">No pudimos conectar tu cuenta</h1>
          <p class="my-4 text-base-content/60" role="alert">{{ error() }}</p>
          <a routerLink="/login" class="btn btn-primary">Volver al inicio de sesión</a>
        } @else {
          <span class="loading loading-spinner text-primary" aria-hidden="true"></span>
          <h1 class="mt-5 text-2xl font-semibold">Un momento, ya casi estás.</h1>
          <p class="mt-4 text-base-content/60">Estamos completando tu acceso con Google.</p>
        }
      </section>
    </main>
  `,
})
export class AuthCallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly error = signal('');

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get('code');
    // Retirar inmediatamente el código de un solo uso del historial y de la URL.
    window.history.replaceState(window.history.state, '', window.location.pathname);
    if (!code || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
      this.error.set(
        'El enlace no es válido o está incompleto. Volvé a iniciar sesión con Google.',
      );
      return;
    }
    this.auth
      .exchangeGoogleCode(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/admin', { replaceUrl: true });
        },
        error: (error: unknown) =>
          this.error.set(
            apiErrorMessage(
              error,
              'El acceso con Google venció o ya fue utilizado. Volvé a iniciar sesión.',
            ),
          ),
      });
  }
}
