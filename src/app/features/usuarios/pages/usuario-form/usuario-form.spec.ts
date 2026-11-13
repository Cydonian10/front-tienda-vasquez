import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { environment } from '../../../../../environments/environment';
import { UsuarioFormPage } from './usuario-form';

describe('UsuarioFormPage', () => {
  let http: HttpTestingController;
  let client: QueryClient;
  const permisos = signal<string[]>([]);
  beforeEach(() => {
    permisos.set(['usuarios.crear', 'usuarios.leer', 'personas.leer']);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      imports: [UsuarioFormPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        {
          provide: PerfilAccess,
          useValue: { puede: (p: string) => permisos().includes(p) },
        },
        { provide: AuthService, useValue: { sessionVersion: 1, userId: () => 'actor' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });

  it('crea por el endpoint protegido sin guardar la contraseña en MutationCache', async () => {
    const fixture = TestBed.createComponent(UsuarioFormPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#usuario-nickname')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    const personas = await vi.waitFor(() => http.expectOne((request) => request.url === `${environment.apiUrl}/personas`));
    personas.flush({ items: [{ id: 'p1', nombres: 'Ana', apellidos: 'Rojas', fotoUrl: null }], page: 1, total: 1, totalPages: 1 });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[aria-label="Seleccionar a Ana Rojas"]')).toBeTruthy();
    });
    fixture.nativeElement.querySelector('[aria-label="Seleccionar a Ana Rojas"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#usuario-nickname')).toBeTruthy();
    const quitar = [...fixture.nativeElement.querySelectorAll('button')].find((button: any) =>
      button.textContent?.includes('Quitar selección'),
    ) as HTMLButtonElement;
    quitar.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#usuario-nickname')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    fixture.nativeElement.querySelector('[aria-label="Seleccionar a Ana Rojas"]').click();
    fixture.detectChanges();
    for (const [id, value] of [
      ['usuario-nickname', 'Ana'],
      ['usuario-email', 'ana@example.com'],
      ['usuario-password', 'secret-password-123'],
    ]) {
      const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    const request = http.expectOne(`${environment.apiUrl}/users/admin`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nickname: 'Ana',
      email: 'ana@example.com',
      personaId: 'p1',
      password: 'secret-password-123',
    });
    expect(fixture.nativeElement.querySelector('#usuario-password').value).toBe('');
    const cancel = [...fixture.nativeElement.querySelectorAll('button')].find((button: any) =>
      button.textContent?.includes('Cancelar'),
    ) as HTMLButtonElement;
    expect(cancel.disabled).toBe(true);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(
      JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((entry) => entry.state.data),
      ),
    ).not.toContain('secret-password-123');
    request.flush({
      id: 'u1',
      nickname: 'Ana',
      email: 'ana@example.com',
      personaId: null,
      persona: null,
    });
    await vi.waitFor(() =>
      expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/admin/usuarios'], {
        state: { usuarioMessage: expect.any(String) },
      }),
    );
  });

  it('no permite crear sin permiso de lectura de personas', () => {
    permisos.set(['usuarios.crear', 'usuarios.leer']);
    const fixture = TestBed.createComponent(UsuarioFormPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Necesitas permiso de lectura de personas');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Selecciona una persona para crear el usuario');
    http.expectNone(`${environment.apiUrl}/users/admin`);
    http.expectNone((request) => request.url === `${environment.apiUrl}/personas`);
  });

  it('permite reintentar la búsqueda y registrar una persona cuando no hay resultados', async () => {
    permisos.set(['usuarios.crear', 'usuarios.leer', 'personas.leer', 'personas.crear']);
    const fixture = TestBed.createComponent(UsuarioFormPage);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne((request) => request.url === `${environment.apiUrl}/personas`)))
      .flush('error', { status: 403, statusText: 'Forbidden' });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las personas');
    });
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    (await vi.waitFor(() => http.expectOne((request) => request.url === `${environment.apiUrl}/personas`)))
      .flush({ items: [], page: 1, total: 0, totalPages: 0 });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay personas registradas');
    });
    expect(fixture.nativeElement.querySelector('a[href="/admin/personas/nueva"]')).toBeTruthy();
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'Ana';
    search.dispatchEvent(new Event('input'));
    (await vi.waitFor(() => http.expectOne((request) => request.url === `${environment.apiUrl}/personas` && request.params.get('nombre') === 'Ana')))
      .flush({ items: [], page: 1, total: 0, totalPages: 0 });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay personas que coincidan');
    });
    expect(fixture.nativeElement.querySelector('a[href="/admin/personas/nueva"]')).toBeNull();
  });
});
