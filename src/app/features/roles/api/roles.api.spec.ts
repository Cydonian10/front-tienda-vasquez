import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { RolesApi } from './roles.api';

describe('RolesApi', () => {
  let http: HttpTestingController;
  let api: RolesApi;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(RolesApi);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it('asigna únicamente los IDs de permisos y codifica el identificador', () => {
    api.asignarPermisos('a/b', ['p1']).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/roles/a%2Fb/permisos`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ permisoIds: ['p1'] });
    request.flush({});
  });
  it('solicita eliminar el rol codificando su identificador', () => {
    api.eliminar('a/b').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/roles/a%2Fb`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
  it('agrupa el catálogo de permisos cuando no se consultan features', () => {
    api.catalogo('permisos').subscribe((groups) => {
      expect(groups).toHaveLength(1);
      expect(groups[0].nombre).toBe('personas');
      expect(groups[0].permisos).toHaveLength(2);
    });
    http.expectOne(`${environment.apiUrl}/permisos`).flush([
      { id: 'p1', featureId: 'f1', codigo: 'personas.leer', nombre: 'Leer' },
      { id: 'p2', featureId: 'f1', codigo: 'personas.crear', nombre: 'Crear' },
    ]);
  });
});
