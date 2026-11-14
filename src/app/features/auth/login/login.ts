import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { email, form, FormField, maxLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { TextField } from '@/shared/components/text-field/text-field';
import { Icon } from '@/shared/components/icon/icon';

@Component({
  selector: 'app-login',
  imports: [FormField, TextField, Icon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly expired = inject(ActivatedRoute).snapshot.queryParamMap.get('expired') === '1';
  protected readonly loginModel = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email);
    email(path.email);
    maxLength(path.email, 254);
    required(path.password);
    maxLength(path.password, 128);
  });
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  private googleRedirectPending = false;

  @HostListener('window:pageshow', ['$event'])
  protected onPageShow(event: PageTransitionEvent): void {
    if (event.persisted && this.googleRedirectPending) {
      this.googleRedirectPending = false;
      this.loading.set(false);
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    this.error.set('');
    if (this.loginForm().invalid()) {
      this.loginForm.email().markAsTouched();
      this.loginForm.password().markAsTouched();
      return;
    }
    this.loading.set(true);
    const { email, password } = this.loginModel();
    this.auth
      .login(email, password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/admin', { replaceUrl: true });
        },
        error: (error: unknown) =>
          this.error.set(
            error instanceof HttpErrorResponse && error.status === 401
              ? 'El correo o la contraseña no son correctos.'
              : apiErrorMessage(
                  error,
                  'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.',
                ),
          ),
      });
  }

  protected googleLogin(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.googleRedirectPending = true;
    try {
      this.auth.startGoogleLogin();
    } catch {
      this.googleRedirectPending = false;
      this.loading.set(false);
      this.error.set('No pudimos conectar con Google. Intentá nuevamente.');
    }
  }
}
