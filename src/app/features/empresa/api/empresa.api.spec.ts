import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { EmpresaDatos } from '@/features/empresa/models/empresa.model';
import { EmpresaApi } from './empresa.api';

describe('EmpresaApi', () => {
  let service: EmpresaApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmpresaApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('obtiene la empresa', () => {
    service.obtener().subscribe((result) => expect(result).toBeNull());
    const request = http.expectOne(`${environment.apiUrl}/empresa`);
    expect(request.request.method).toBe('GET');
    request.flush(null);
  });

  it('envía los datos y el logo mediante multipart', () => {
    const datos: EmpresaDatos = {
      razonSocial: 'Tienda',
      nombreComercial: '',
      actividad: '',
      tipoDocumento: 'RUC',
      numeroDocumento: '123',
      tipoEmpresa: '',
      direccion: 'Jauja',
      telefono: '',
      correo: ' correo@ejemplo.com ',
    };
    const logo = new File(['logo'], 'logo.png', { type: 'image/png' });
    service.guardar(datos, logo).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/empresa`);
    expect(request.request.method).toBe('PUT');
    expect(JSON.parse(request.request.body.get('data')).correo).toBe('correo@ejemplo.com');
    expect(request.request.body.get('logo')).toBe(logo);
    request.flush({ ...datos, id: 1, logoUrl: null });
  });
});
