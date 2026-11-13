import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PersonaDatos } from '@/features/personas/models/persona.model';
import { PersonasApi } from './personas.api';

describe('PersonasApi', () => {
  it('obtiene una persona por ID codificando el segmento de URL', () => {
    service.obtener('a/b').subscribe((persona) => expect(persona.id).toBe('a/b'));
    const request = http.expectOne(`${environment.apiUrl}/personas/a%2Fb`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'a/b' });
  });
  let service: PersonasApi;
  let http: HttpTestingController;
  const datos: PersonaDatos = {
    nombres: 'Ana',
    apellidos: 'Rojas',
    tipoDocumento: 'DNI',
    numeroDocumento: '123',
    correo: '',
    telefono: '',
    fechaNacimiento: '',
    estado: 'Activa',
    direccion: '',
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PersonasApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta la página y el filtro de nombre', () => {
    service.listar(2, 8, 'Ana Rojas').subscribe((result) => expect(result.total).toBe(0));
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/personas`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('8');
    expect(request.request.params.get('nombre')).toBe('Ana Rojas');
    request.flush({ items: [], total: 0, page: 2, limit: 8, totalPages: 0 });
  });

  it('envía datos y foto multipart al crear', () => {
    const foto = new File(['imagen'], 'foto.png', { type: 'image/png' });
    service.crear(datos, foto).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/personas`);
    expect(request.request.method).toBe('POST');
    expect(JSON.parse(request.request.body.get('data'))).toEqual(datos);
    expect(request.request.body.get('foto')).toBe(foto);
    request.flush({ ...datos, id: '1', empresaId: 1, fotoUrl: null });
  });

  it('actualiza sin enviar foto si se conserva la existente', () => {
    service.actualizar('a/b', datos, null).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/personas/a%2Fb`);
    expect(request.request.method).toBe('PUT');
    expect(JSON.parse(request.request.body.get('data'))).toEqual(datos);
    expect(request.request.body.has('foto')).toBe(false);
    request.flush({ ...datos, id: 'a/b', empresaId: 1, fotoUrl: null });
  });
});
