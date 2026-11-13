import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../../../environments/environment';
import { PersonasListPage } from './personas-list';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { signal } from '@angular/core';

const url = `${environment.apiUrl}/personas`;
const persona = {
  id: '1',
  empresaId: 1,
  nombres: 'Ana',
  apellidos: 'Rojas',
  tipoDocumento: 'DNI',
  numeroDocumento: '12345678',
  correo: null,
  telefono: null,
  fechaNacimiento: null,
  estado: 'Activa',
  direccion: null,
  fotoUrl: 'https://example.com/foto.png',
};
const pagina = (items = [persona], total = items.length, page = 1) => ({
  items,
  total,
  page,
  limit: 8,
  totalPages: Math.ceil(total / 8),
});

describe('PersonasListPage', () => {
  let http: HttpTestingController;
  let queryClient: QueryClient;
  const permisos = signal<string[]>([]);
  beforeEach(() => {
    permisos.set(['personas.leer', 'personas.crear', 'personas.editar']);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      imports: [PersonasListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(queryClient),
        {
          provide: PerfilAccess,
          useValue: { puede: (permiso: string) => permisos().includes(permiso) },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    queryClient.clear();
    TestBed.resetTestingModule();
  });
  async function setup(items = [persona], total = items.length) {
    const fixture = TestBed.createComponent(PersonasListPage);
    fixture.detectChanges();
    const req = await vi.waitFor(() => http.expectOne((request) => request.url === url));
    req.flush(pagina(items, total));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-pagination')).toBeTruthy();
    });
    return fixture;
  }
  it('muestra los datos, foto y solicita la página y búsqueda al servidor', async () => {
    const fixture = await setup([persona], 12);
    expect(fixture.nativeElement.textContent).toContain('Ana Rojas');
    expect(fixture.nativeElement.querySelector('img.avatar').getAttribute('src')).toBe(
      persona.fotoUrl,
    );
    fixture.nativeElement.querySelector('[aria-label="Página 2"]').click();
    fixture.detectChanges();
    const next = await vi.waitFor(() =>
      http.expectOne((req) => req.url === url && req.params.get('page') === '2'),
    );
    next.flush(pagina([], 12, 2));
    const search = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;
    search.value = 'Ana';
    search.dispatchEvent(new Event('input'));
    const filtered = await vi.waitFor(
      () => http.expectOne((req) => req.url === url && req.params.get('nombre') === 'Ana'),
      { timeout: 2000 },
    );
    expect(filtered.request.params.get('page')).toBe('1');
    filtered.flush(pagina([persona]));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Ana Rojas');
    });
  });
  it('enlaza a las páginas de creación y edición sin abrir diálogos', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.primary-button').getAttribute('href')).toBe(
      '/admin/personas/nueva',
    );
    expect(fixture.nativeElement.querySelector('.edit-button').getAttribute('href')).toBe(
      '/admin/personas/1/editar',
    );
  });
  it('ofrece crear la primera persona cuando el listado está vacío', async () => {
    const fixture = await setup([], 0);
    expect(fixture.nativeElement.textContent).toContain('Tu equipo empieza aquí');
    expect(fixture.nativeElement.querySelector('.empty a').getAttribute('href')).toBe(
      '/admin/personas/nueva',
    );
  });
  it('oculta crear y editar cuando solo tiene lectura', async () => {
    permisos.set(['personas.leer']);
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.primary-button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.edit-button')).toBeNull();
  });
  it('no ofrece registrar una persona en el estado vacío sin permiso de creación', async () => {
    permisos.set(['personas.leer']);
    const fixture = await setup([], 0);
    expect(fixture.nativeElement.querySelector('.empty a')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay personas registradas');
  });
  it('muestra un error de carga y permite reintentar', async () => {
    const fixture = TestBed.createComponent(PersonasListPage);
    fixture.detectChanges();
    const first = await vi.waitFor(() => http.expectOne((req) => req.url === url));
    first.flush('error', { status: 500, statusText: 'Error' });
    const retry = await vi.waitFor(() => http.expectOne((req) => req.url === url), {
      timeout: 3000,
    });
    retry.flush('error', { status: 500, statusText: 'Error' });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el listado');
    });
    expect(fixture.nativeElement.textContent).not.toContain('Tu equipo empieza aquí');
    fixture.nativeElement.querySelector('.empty button').click();
    const next = await vi.waitFor(() => http.expectOne((req) => req.url === url));
    next.flush(pagina([], 0));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Tu equipo empieza aquí');
    });
  });
});
