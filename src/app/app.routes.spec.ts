import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService } from '@/core/auth/auth.service';
import { LoginPage } from '@/features/auth/login/login';

describe('Feature routes', () => {
  const auth = {
    accessToken: null as string | null,
    session: signal<{ userId: string } | null>(null),
    sessionVersion: 1,
    logout: vi.fn(),
  };
  let queryClient: QueryClient;

  beforeEach(() => {
    auth.accessToken = null;
    auth.session.set(null);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(queryClient),
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    queryClient.clear();
    TestBed.resetTestingModule();
  });

  it.each(['/admin/personas', '/admin/personas/nueva', '/admin/personas/123/editar'])(
    'redirects %s to login without a session',
    async (url) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url, LoginPage);
      expect(TestBed.inject(Router).url).toBe('/login');
      expect(harness.routeNativeElement?.textContent).toContain('Iniciar sesión');
    },
  );

  it('preserves the home redirect and placeholder URLs', async () => {
    auth.accessToken = 'token';
    const harness = await RouterTestingHarness.create('/');
    expect(TestBed.inject(Router).url).toBe('/admin');
    await harness.navigateByUrl('/admin/reportes');
    expect(TestBed.inject(Router).url).toBe('/admin/reportes');
    expect(harness.routeNativeElement?.textContent).toContain('Aquí irá reportes');
  });

  it.each([
    ['/admin/empresa', '/empresa', null, 'Información'],
    ['/admin/ventas', '/ventas', { items: [], total: 0, totalPages: 0 }, 'Todas las ventas'],
    [
      '/admin/personas',
      '/personas',
      { items: [], total: 0, page: 1, limit: 8, totalPages: 0 },
      'Personas',
    ],
  ])('lazy loads %s at its existing URL', async (path, endpoint, response, heading) => {
    auth.accessToken = 'token';
    auth.session.set({ userId: 'user-1' });
    const harness = await RouterTestingHarness.create();
    const http = TestBed.inject(HttpTestingController);
    const navigation = harness.navigateByUrl(path);
    const profile = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/auth/me`));
    profile.flush({
      id: 'user-1',
      nickname: 'Ana',
      email: 'ana@example.com',
      persona: null,
      roles: [],
      permisos: [
        'ventas.leer',
        'empresa.leer',
        'empresa.editar',
        'personas.leer',
        'personas.crear',
        'personas.editar',
      ],
    });
    await navigation;
    const request = await vi.waitFor(() =>
      http.expectOne((req) => req.url === `${environment.apiUrl}${endpoint}`),
    );
    request.flush(response);
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain(heading);
    });
    expect(TestBed.inject(Router).url).toBe(path);
  });

  it.each([
    ['/admin/personas', ['personas.crear'], '/admin/acceso?motivo=denegado'],
    ['/admin/personas/123/editar', ['personas.editar'], '/admin/acceso?motivo=denegado'],
    ['/admin/empresa', ['personas.leer'], '/admin/acceso?motivo=denegado'],
    ['/admin/ventas', ['ventas.crear'], '/admin/acceso?motivo=denegado'],
    ['/admin/ventas/nueva', ['ventas.crear', 'productos.leer'], '/admin/acceso?motivo=denegado'],
    ['/admin/usuarios', ['roles.leer'], '/admin/acceso?motivo=denegado'],
    ['/admin/roles-permisos', ['usuarios.leer'], '/admin/acceso?motivo=denegado'],
    ['/admin/usuarios/nuevo', ['usuarios.leer'], '/admin/acceso?motivo=denegado'],
    ['/admin/usuarios/123/editar', ['usuarios.editar'], '/admin/acceso?motivo=denegado'],
    ['/admin/roles-permisos/nuevo', ['roles.leer'], '/admin/acceso?motivo=denegado'],
    ['/admin/usuarios/nuevo', ['usuarios.crear'], '/admin/usuarios/nuevo'],
    ['/admin/roles-permisos/nuevo', ['roles.crear'], '/admin/roles-permisos/nuevo'],
    ['/admin/personas/nueva', ['personas.crear'], '/admin/personas/nueva'],
  ])('aplica los permisos a la ruta directa %s', async (path, permisos, expected) => {
    auth.accessToken = 'token';
    auth.session.set({ userId: 'user-1' });
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl(path);
    const http = TestBed.inject(HttpTestingController);
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/auth/me`));
    request.flush({
      id: 'user-1',
      nickname: 'Ana',
      email: 'ana@example.com',
      persona: null,
      roles: [],
      permisos,
    });
    await navigation;
    expect(TestBed.inject(Router).url).toBe(expected);
    if (path === '/admin/personas/nueva') {
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Volver al inicio');
    }
    http.expectNone(`${environment.apiUrl}/personas/123`);
  });
});
