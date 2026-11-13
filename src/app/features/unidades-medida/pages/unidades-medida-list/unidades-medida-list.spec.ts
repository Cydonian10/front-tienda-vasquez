import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../../../environments/environment';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { UnidadesMedidaListPage } from './unidades-medida-list';

describe('UnidadesMedidaListPage', () => {
  const permisos = signal<string[]>([]);
  const url = `${environment.apiUrl}/unidades-medida`;
  let http: HttpTestingController;
  let client: QueryClient;
  beforeEach(() => {
    permisos.set([
      'unidades-medida.leer',
      'unidades-medida.crear',
      'unidades-medida.editar',
      'unidades-medida.eliminar',
    ]);
    client = new QueryClient();
    TestBed.configureTestingModule({
      imports: [UnidadesMedidaListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
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
    client.clear();
    TestBed.resetTestingModule();
  });
  it('muestra datos, acciones según permisos y filtra desde el servidor', async () => {
    const fixture = TestBed.createComponent(UnidadesMedidaListPage);
    fixture.detectChanges();
    const req = await vi.waitFor(() => http.expectOne((r) => r.url === url));
    req.flush({
      items: [{ id: '1', nombre: 'Kilogramo', abreviatura: 'kg' }],
      total: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Kilogramo');
    });
    expect(fixture.nativeElement.querySelector('[aria-label="Editar Kilogramo"]')).toBeTruthy();
    permisos.set(['unidades-medida.leer']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Editar Kilogramo"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Eliminar Kilogramo"]')).toBeNull();
    const input = fixture.nativeElement.querySelector('input[type=search]') as HTMLInputElement;
    input.value = 'Agua';
    input.dispatchEvent(new Event('input'));
    const search = await vi.waitFor(
      () => http.expectOne((r) => r.url === url && r.params.get('nombre') === 'Agua'),
      { timeout: 2000 },
    );
    expect(search.request.params.get('page')).toBe('1');
    search.flush({ items: [], total: 0, page: 1, limit: 8, totalPages: 0 });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No encontramos unidades de medida');
    });
  });
});
