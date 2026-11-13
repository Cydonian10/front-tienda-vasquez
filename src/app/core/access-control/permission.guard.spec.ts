import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../environments/environment';
import { AuthService } from '@/core/auth/auth.service';
import { requirePermissions } from './permission.guard';
import { PERMISOS } from './permissions';
import { PerfilQueries } from './perfil.queries';

describe('Permission guard', () => {
  const session = signal<{ userId: string } | null>({ userId: 'user-1' });
  const auth = { accessToken: 'token' as string | null, session, sessionVersion: 1 };
  let http: HttpTestingController;
  let client: QueryClient;
  const profile = (permisos: string[]) => ({
    id: 'user-1',
    email: 'ana@example.com',
    nickname: 'Ana',
    persona: null,
    roles: [],
    permisos,
  });

  beforeEach(() => {
    session.set({ userId: 'user-1' });
    auth.accessToken = 'token';
    auth.sessionVersion = 1;
    client = new QueryClient();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });

  function check(...permissions: Parameters<typeof requirePermissions>) {
    return TestBed.runInInjectionContext(() =>
      requirePermissions(...permissions)(
        {} as ActivatedRouteSnapshot,
        { url: '/admin/personas' } as RouterStateSnapshot,
      ),
    ) as Promise<boolean | UrlTree>;
  }

  it('espera el perfil y reutiliza la caché para las siguientes rutas', async () => {
    const result = check(PERMISOS.PERSONAS.LEER);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(profile(['personas.leer']));
    expect(await result).toBe(true);
    expect(await check(PERMISOS.PERSONAS.LEER)).toBe(true);
    http.expectNone(`${environment.apiUrl}/auth/me`);
  });

  it('deniega la ruta si falta cualquiera de los permisos requeridos', async () => {
    const result = check(PERMISOS.PERSONAS.LEER, PERMISOS.PERSONAS.EDITAR);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(profile(['personas.leer']));
    expect(TestBed.inject(Router).serializeUrl((await result) as UrlTree)).toBe(
      '/admin/acceso?motivo=denegado',
    );
  });

  it('distingue un error de perfil de un permiso denegado y no reintenta 4xx', async () => {
    const result = check(PERMISOS.PERSONAS.LEER);
    http
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(TestBed.inject(Router).serializeUrl((await result) as UrlTree)).toContain(
      '/admin/acceso?motivo=error',
    );
    http.expectNone(`${environment.apiUrl}/auth/me`);
  });

  it('no autoriza con datos anteriores cuando falla una actualización del perfil', async () => {
    const options = TestBed.inject(PerfilQueries).actual();
    client.setQueryData(options.queryKey, profile(['personas.leer']));
    client.getQueryCache().find({ queryKey: options.queryKey })!.setState({
      status: 'error',
      error: new Error('Sin conexión'),
    });
    const result = await check(PERMISOS.PERSONAS.LEER);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('motivo=error');
    http.expectNone(`${environment.apiUrl}/auth/me`);
  });

  it('no acepta un perfil de otro usuario', async () => {
    const result = check(PERMISOS.PERSONAS.LEER);
    http
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ ...profile(['personas.leer']), id: 'otro' });
    // El perfil inválido recibe el mismo reintento que un error de transporte.
    const retry = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/auth/me`), {
      timeout: 3000,
    });
    retry.flush({ ...profile(['personas.leer']), id: 'otro' });
    expect(TestBed.inject(Router).serializeUrl((await result) as UrlTree)).toContain(
      'motivo=error',
    );
  });

  it('no utiliza la respuesta de una sesión anterior', async () => {
    const result = check(PERMISOS.PERSONAS.LEER);
    const request = http.expectOne(`${environment.apiUrl}/auth/me`);
    auth.sessionVersion++;
    request.flush(profile(['personas.leer']));
    expect(TestBed.inject(Router).serializeUrl((await result) as UrlTree)).toBe('/admin');
    http.expectNone(`${environment.apiUrl}/auth/me`);
    expect(client.getQueryData(['perfil', 'user-1', 1])).toBeUndefined();
  });

  it('redirige al login sin consultar si no existe sesión', async () => {
    auth.accessToken = null;
    expect(
      TestBed.inject(Router).serializeUrl((await check(PERMISOS.PERSONAS.LEER)) as UrlTree),
    ).toBe('/login');
    http.expectNone(`${environment.apiUrl}/auth/me`);
  });
});
