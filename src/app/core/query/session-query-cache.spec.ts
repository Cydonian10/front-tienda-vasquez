import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../environments/environment';
import { EmpresaMutations } from '@/features/empresa/queries/empresa.mutations';
import { EmpresaQueries } from '@/features/empresa/queries/empresa.queries';
import { empresaKeys } from '@/features/empresa/queries/empresa.keys';
import { PersonasMutations } from '@/features/personas/queries/personas.mutations';
import { AuthService } from '@/core/auth/auth.service';
import { authInterceptor } from '@/core/auth/auth.interceptor';
import { httpQuery } from './http-query';
import { provideSessionQueryCache } from './session-query-cache';
import { permissionInterceptor } from '@/core/access-control/permission.interceptor';
import { PerfilQueries } from '@/core/access-control/perfil.queries';

describe('Session query cache', () => {
  let http: HttpTestingController;
  let queryClient: QueryClient;
  let auth: AuthService;

  beforeEach(async () => {
    sessionStorage.clear();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, permissionInterceptor])),
        provideHttpClientTesting(),
        provideTanStackQuery(queryClient),
        provideSessionQueryCache(),
      ],
    });
    const initialization = TestBed.inject(ApplicationInitStatus);
    await initialization.donePromise;
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    queryClient.clear();
    TestBed.resetTestingModule();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  function login(seconds = 900) {
    const encode = (value: object) => btoa(JSON.stringify(value));
    const token = `${encode({ alg: 'HS256' })}.${encode({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + seconds })}.signature`;
    auth.login('user@example.com', 'password').subscribe();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ accessToken: token, expiresIn: seconds });
  }

  it('clears cached private data and aborts pending HTTP queries on logout', async () => {
    login();
    queryClient.setQueryData(['personas'], ['private']);
    const pending = queryClient
      .fetchQuery(TestBed.inject(EmpresaQueries).obtener())
      .catch(() => undefined);
    const request = http.expectOne(`${environment.apiUrl}/empresa`);

    auth.logout();

    expect(request.cancelled).toBe(true);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    await pending;
  });

  it('clears private data when a protected request returns 401', () => {
    login();
    queryClient.setQueryData(['personas'], ['private']);
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}/personas`)
      .subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}/personas`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.session()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('invalida el perfil con un 403 sin cerrar la sesión', () => {
    login();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}/personas`)
      .subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}/personas`)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.session()).not.toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['perfil'] });
  });

  it('no invalida el perfil de otra sesión ante un 403 tardío', () => {
    login();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}/personas`)
      .subscribe({ error: () => {} });
    const oldRequest = http.expectOne(`${environment.apiUrl}/personas`);
    login();
    oldRequest.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('no cierra una sesión nueva por un 401 tardío de la sesión anterior', () => {
    login();
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}/personas`)
      .subscribe({ error: () => {} });
    const oldRequest = http.expectOne(`${environment.apiUrl}/personas`);
    login();
    oldRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.session()).not.toBeNull();
  });

  it('cancela la consulta del perfil y limpia su caché al cerrar sesión', async () => {
    login();
    const pending = queryClient
      .fetchQuery(TestBed.inject(PerfilQueries).actual())
      .catch(() => undefined);
    const request = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(request.request.headers.get('Authorization')).toMatch(/^Bearer /);
    auth.logout();
    expect(request.cancelled).toBe(true);
    await pending;
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('clears cache on automatic session expiry', () => {
    vi.useFakeTimers();
    login(1);
    queryClient.setQueryData(['personas'], ['private']);
    vi.advanceTimersByTime(1100);
    expect(auth.session()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('clears previous data when accepting a new session', () => {
    queryClient.setQueryData(['personas'], ['previous user']);
    login();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('does not restore cache from a mutation that finishes after logout', async () => {
    login();
    const options = TestBed.inject(EmpresaMutations).guardar();
    const mutation = queryClient.getMutationCache().build(queryClient, options);
    const pending = mutation.execute({
      datos: {
        razonSocial: 'Tienda',
        nombreComercial: '',
        actividad: '',
        tipoDocumento: 'RUC',
        numeroDocumento: '123',
        tipoEmpresa: '',
        direccion: '',
        telefono: '',
        correo: '',
      },
      logo: null,
    });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/empresa`));
    auth.logout();
    request.flush({ id: 1, razonSocial: 'Tienda' });
    await pending;
    expect(queryClient.getQueryData(empresaKeys.actual)).toBeUndefined();
  });

  it('does not send an HTTP request when its cancellation signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      httpQuery(TestBed.inject(HttpClient).get('/cancelled'), controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    http.expectNone('/cancelled');
  });

  it('invalida usuarios y perfil vinculado al actualizar una persona', async () => {
    login();
    const profileKey = ['perfil', auth.userId(), auth.sessionVersion];
    queryClient.setQueryData(profileKey, { persona: { id: 'persona-1' } });
    queryClient.setQueryData(['usuarios', 'lista'], []);
    const mutation = queryClient
      .getMutationCache()
      .build(queryClient, TestBed.inject(PersonasMutations).actualizar());
    const pending = mutation.execute({
      id: 'persona-1',
      datos: {
        nombres: 'Ana',
        apellidos: 'Rojas',
        tipoDocumento: 'DNI',
        numeroDocumento: '123',
        correo: '',
        telefono: '',
        fechaNacimiento: '',
        estado: 'Activa',
        direccion: '',
      },
      foto: null,
    });
    const request = await vi.waitFor(() =>
      http.expectOne(`${environment.apiUrl}/personas/persona-1`),
    );
    request.flush({ id: 'persona-1', nombres: 'Ana' });
    await pending;
    expect(queryClient.getQueryState(['usuarios', 'lista'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(profileKey)?.isInvalidated).toBe(true);
  });

  it.each(['crear', 'actualizar'] as const)(
    'does not restore person cache after logout with %s',
    async (operation) => {
      login();
      const mutations = TestBed.inject(PersonasMutations);
      const options = operation === 'crear' ? mutations.crear() : mutations.actualizar();
      const mutation = queryClient.getMutationCache().build(queryClient, options);
      const pending = mutation.execute({
        id: 'persona-1',
        datos: {
          nombres: 'Ana',
          apellidos: 'Rojas',
          tipoDocumento: 'DNI',
          numeroDocumento: '123',
          correo: '',
          telefono: '',
          fechaNacimiento: '',
          estado: 'Activa',
          direccion: '',
        },
        foto: null,
      });
      const request = await vi.waitFor(() =>
        http.expectOne(
          `${environment.apiUrl}/personas${operation === 'actualizar' ? '/persona-1' : ''}`,
        ),
      );
      expect(request.request.method).toBe(operation === 'crear' ? 'POST' : 'PUT');
      auth.logout();
      request.flush({ id: 'persona-1', nombres: 'Ana' });
      await pending;
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    },
  );
});
