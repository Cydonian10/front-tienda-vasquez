import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, tap } from 'rxjs';
import { AuthApi } from './auth.api';
import { Session, TokenResponse } from './auth.model';

const STORAGE_KEY = 'tienda-vasquez.session';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly state = signal<Session | null>(null);
  private readonly sessionClearedSubject = new Subject<void>();
  private revision = 0;
  readonly sessionCleared = this.sessionClearedSubject.asObservable();
  private expiryTimer?: ReturnType<typeof setTimeout>;
  readonly session = this.state.asReadonly();
  readonly userId = computed(() => this.state()?.userId ?? null);

  constructor() {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (
        stored &&
        typeof stored === 'object' &&
        'accessToken' in stored &&
        typeof stored.accessToken === 'string' &&
        'expiresAt' in stored &&
        typeof stored.expiresAt === 'number'
      ) {
        const session = this.parseToken(stored.accessToken, stored.expiresAt);
        this.state.set(session);
        this.scheduleExpiry(session);
      } else {
        this.clear();
      }
    } catch {
      this.clear();
    }
  }

  get accessToken(): string | null {
    const session = this.state();
    return session && session.expiresAt > Date.now() ? session.accessToken : null;
  }

  /** Identidad de ciclo de sesión sin exponer el JWT a la caché de mutaciones. */
  get sessionVersion(): number {
    return this.revision;
  }

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(tap((response) => this.save(response)));
  }

  startGoogleLogin(): void {
    this.api.startGoogleLogin();
  }

  exchangeGoogleCode(code: string) {
    return this.api.exchangeGoogleCode(code).pipe(tap((response) => this.save(response)));
  }

  logout(expired = false): void {
    this.clear();
    void this.router.navigate(['/login'], {
      queryParams: expired ? { expired: '1' } : {},
      replaceUrl: true,
    });
  }

  private save(response: TokenResponse): void {
    if (!Number.isFinite(response.expiresIn) || response.expiresIn <= 0) {
      throw new Error('La API devolvió una sesión no válida.');
    }
    const session = this.parseToken(response.accessToken, Date.now() + response.expiresIn * 1000);
    this.clear();
    this.state.set(session);
    // Solo se persiste en esta pestaña; no se almacena la contraseña.
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* Sesión en memoria. */
    }
    this.scheduleExpiry(session);
  }

  private parseToken(accessToken: string, expiresAt: number): Session {
    const parts = accessToken.split('.');
    if (parts.length !== 3) throw new Error('JWT no válido.');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')),
      (character) => character.charCodeAt(0),
    );
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof claims.sub !== 'string' ||
      !claims.sub ||
      typeof claims.exp !== 'number' ||
      !Number.isFinite(claims.exp)
    ) {
      throw new Error('JWT no válido.');
    }
    expiresAt = Math.min(expiresAt, claims.exp * 1000);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('Sesión vencida.');
    // Estos datos son informativos. La API verifica la firma y los permisos.
    return {
      accessToken,
      expiresAt,
      userId: claims.sub,
      method:
        Array.isArray(claims.amr) && claims.amr.includes('oidc:google') ? 'Google' : 'Contraseña',
    };
  }

  private scheduleExpiry(session: Session): void {
    this.expiryTimer = setTimeout(
      () => this.logout(true),
      Math.min(session.expiresAt - Date.now(), 2_147_483_647),
    );
  }

  private clear(): void {
    clearTimeout(this.expiryTimer);
    this.state.set(null);
    this.revision++;
    this.sessionClearedSubject.next();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Almacenamiento no disponible. */
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.expiryTimer);
    this.sessionClearedSubject.complete();
  }
}
