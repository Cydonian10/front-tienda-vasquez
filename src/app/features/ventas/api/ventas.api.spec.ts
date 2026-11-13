import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { VentasApi } from './ventas.api';
import type { VentaDatos } from '../models/venta.model';

describe('VentasApi', () => {
  let api: VentasApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(VentasApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('envía el rango y la página del historial', () => {
    api.listar('2026-11-01', '2026-11-13', 2).subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/ventas`);
    expect(req.request.params.get('fechaInicio')).toBe('2026-11-01');
    expect(req.request.params.get('fechaFin')).toBe('2026-11-13');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], total: 0, totalPages: 0 });
  });
  it('combina búsqueda, categoría y página en el catálogo', () => {
    api.productos(2, 'arroz', 'categoria').subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/productos`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('nombre')).toBe('arroz');
    expect(req.request.params.get('categoriaId')).toBe('categoria');
    req.flush({ items: [], total: 0, totalPages: 0 });
  });
  it('envía la venta sin alterar sus datos', () => {
    const datos: VentaDatos = {
      operacionId: 'operacion',
      modalidad: 'fiado',
      clienteId: 'cliente',
      vencimiento: null,
      detalles: [{ productoId: 'producto', unidadId: 'unidad', cantidad: '2' }],
    };
    api.crear(datos).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/ventas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    req.flush({ id: 'venta', fecha: '2026-11-13', total: '10.00', modalidad: 'fiado' });
  });
  it('solicita un PDF como Blob por una ruta autenticada', () => {
    api.ticketPdf('venta').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/ventas/venta/ticket.pdf`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });
});
