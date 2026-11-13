import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { MarcasApi } from './marcas.api';

describe('MarcasApi', () => {
  let api: MarcasApi;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/marcas`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MarcasApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envía paginación y búsqueda', () => {
    api.listar(2, 8, 'Nike').subscribe();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('8');
    expect(req.request.params.get('nombre')).toBe('Nike');
    req.flush({ items: [], total: 0, page: 2, limit: 8, totalPages: 0 });
  });
  it('implementa lectura, creación, edición y eliminación', () => {
    const datos = { nombre: 'Nike', descripcion: null };
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
