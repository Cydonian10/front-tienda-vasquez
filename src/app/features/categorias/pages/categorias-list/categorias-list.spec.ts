import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../../../environments/environment';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { CategoriasListPage } from './categorias-list';

describe('CategoriasListPage', () => {
  const permisos = signal<string[]>([]);
  const url = `${environment.apiUrl}/categorias`;
  let http: HttpTestingController;
  let client: QueryClient;
  beforeEach(() => {
    permisos.set([
      'categorias.leer',
      'categorias.crear',
      'categorias.editar',
      'categorias.eliminar',
    ]);
    client = new QueryClient();
    TestBed.configureTestingModule({
      imports: [CategoriasListPage],
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
    const fixture = TestBed.createComponent(CategoriasListPage);
    fixture.detectChanges();
    const req = await vi.waitFor(() => http.expectOne((r) => r.url === url));
    req.flush({
      items: [{ id: '1', nombre: 'Bebidas', descripcion: null }],
      total: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Bebidas');
    });
    expect(fixture.nativeElement.querySelector('[aria-label="Editar Bebidas"]')).toBeTruthy();
    permisos.set(['categorias.leer']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Editar Bebidas"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Eliminar Bebidas"]')).toBeNull();
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
      expect(fixture.nativeElement.textContent).toContain('No encontramos categorías');
    });
  });
});
