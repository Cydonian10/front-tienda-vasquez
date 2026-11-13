import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { CategoriasApi } from './categorias.api';
describe('CategoriasApi', () => {
  let api: CategoriasApi;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/categorias`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CategoriasApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envía paginación y filtro', () => {
    api.listar(2, 8, 'Bebidas').subscribe();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('8');
    expect(req.request.params.get('nombre')).toBe('Bebidas');
    req.flush({ items: [], total: 0, page: 2, limit: 8, totalPages: 0 });
  });
  it('usa los métodos CRUD y codifica el id', () => {
    const datos = { nombre: 'Bebidas', descripcion: null };
    api.obtener('a/b').subscribe();
    const get = http.expectOne(`${url}/a%2Fb`);
    expect(get.request.method).toBe('GET');
    get.flush({ id: 'a/b', ...datos });
    api.crear(datos).subscribe();
    const post = http.expectOne(url);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(datos);
    post.flush({ id: '1', ...datos });
    api.actualizar('a/b', datos).subscribe();
    const put = http.expectOne(`${url}/a%2Fb`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(datos);
    put.flush({ id: 'a/b', ...datos });
    api.eliminar('a/b').subscribe();
    const del = http.expectOne(`${url}/a%2Fb`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });
});
