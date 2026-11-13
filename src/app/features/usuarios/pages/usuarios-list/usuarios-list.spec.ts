import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { environment } from '../../../../../environments/environment';
import { UsuariosListPage } from './usuarios-list';

describe('UsuariosListPage', () => {
  const permisos = signal<string[]>([]);
  let http: HttpTestingController;
  let client: QueryClient;
  const usuario = {
    id: 'user-1',
    nickname: 'ana',
    email: 'ana@example.com',
    personaId: 'p-1',
    persona: { id: 'p-1', nombres: 'Ana', apellidos: 'Rojas', fotoUrl: null },
  };
  beforeEach(() => {
    permisos.set(['usuarios.leer', 'personas.leer']);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      imports: [UsuariosListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        {
          provide: PerfilAccess,
          useValue: {
            puede: (p: string) => permisos().includes(p),
            perfil: { data: () => ({ permisos: permisos() }) },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });

  it('lista usuarios con su persona, filtra y oculta acciones sin permiso', async () => {
    const fixture = TestBed.createComponent(UsuariosListPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users`));
    request.flush([usuario]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Ana Rojas');
    });
    expect(fixture.nativeElement.textContent).not.toContain('Nuevo usuario');
    expect(fixture.nativeElement.querySelector('a[href*="editar"]')).toBeNull();
    const search = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;
    search.value = 'no existe';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos usuarios');
  });

  it('abre directamente la creación desde el listado cuando tiene permiso', async () => {
    permisos.set(['usuarios.leer', 'usuarios.crear']);
    const fixture = TestBed.createComponent(UsuariosListPage);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users`))).flush([]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-pagination')).toBeTruthy();
    });
    expect(fixture.nativeElement.querySelector('a[href="/admin/usuarios/nuevo"]')).toBeTruthy();
  });

  it('abre un diálogo accesible con detalles de persona y roles', async () => {
    const fixture = TestBed.createComponent(UsuariosListPage);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users`))).flush([usuario]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('button[aria-label="Información de ana"]'),
      ).toBeTruthy();
    });
    fixture.nativeElement.querySelector('button[aria-label="Información de ana"]').click();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/user-1/roles`))).flush([
      { id: 'r-1', nombre: 'Vendedor', activo: true, sistema: false, permisos: [] },
    ]);
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/personas/p-1`))).flush({
      id: 'p-1',
      nombres: 'Ana',
      apellidos: 'Rojas',
      tipoDocumento: 'DNI',
      numeroDocumento: '123',
      estado: 'Activa',
      correo: null,
      telefono: null,
      direccion: 'Jauja',
      fechaNacimiento: null,
    });
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.body.textContent).toContain('Información del usuario');
      expect(document.body.textContent).toContain('Vendedor');
      expect(document.body.textContent).toContain('DNI');
      expect(document.body.textContent).toContain('Jauja');
    });
  });
});
