import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { environment } from '../../../../../environments/environment';
import { PuntoVenta } from './punto-venta';

describe('Punto de venta', () => {
  let client: QueryClient, http: HttpTestingController;
  const access = { puede: (_permiso: string) => false };
  beforeEach(() => {
    access.puede = () => false;
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      imports: [PuntoVenta],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        { provide: AuthService, useValue: { sessionVersion: 1 } },
        { provide: PerfilAccess, useValue: access },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    try {
      http.verify();
    } finally {
      client.clear();
      TestBed.resetTestingModule();
    }
  });
  it('espera a que termine la escritura antes de buscar productos', async () => {
    const fixture = TestBed.createComponent(PuntoVenta);
    fixture.detectChanges();
    const url = environment.apiUrl;
    (await vi.waitFor(() => http.expectOne((r) => r.url === `${url}/productos`))).flush({
      items: [], total: 0, totalPages: 0,
    });
    http.expectOne((r) => r.url === `${url}/unidades-medida`).flush({ items: [], totalPages: 0 });
    const input = fixture.nativeElement.querySelector('#venta-busqueda') as HTMLInputElement;
    for (const value of ['a', 'ar', 'arroz']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
    http.expectNone((r) => r.url === `${url}/productos`);
    const request = await vi.waitFor(() => http.expectOne((r) => r.url === `${url}/productos`));
    expect(request.request.params.get('nombre')).toBe('arroz');
    expect(request.request.params.get('page')).toBe('1');
    request.flush({ items: [], total: 0, totalPages: 0 });
  });
  it('agrega un producto y conserva el identificador al reintentar una venta fallida', async () => {
    access.puede = (permiso: string) => permiso === 'personas.leer';
    const fixture = TestBed.createComponent(PuntoVenta);
    fixture.detectChanges();
    const url = environment.apiUrl;
    (await vi.waitFor(() => http.expectOne((r) => r.url === `${url}/productos`))).flush({
      items: [
        {
          id: 'p',
          nombre: 'Arroz',
          marca: 'Marca',
          precio: '5.00',
          stock: '20',
          unidad: 'Unidad',
          imagen: null,
        },
      ],
      total: 1,
      totalPages: 1,
    });
    http
      .expectOne((r) => r.url === `${url}/unidades-medida`)
      .flush({
        items: [
          { id: 'u', nombre: 'Unidad' },
          { id: 'c', nombre: 'Caja' },
        ],
        totalPages: 1,
      });
    const button = async (label: string) =>
      vi.waitFor(() => {
        fixture.detectChanges();
        const buttons = [...document.querySelectorAll('button')] as HTMLButtonElement[];
        const found = buttons.find((b) => b.textContent?.includes(label));
        expect(found).toBeDefined();
        return found!;
      });
    (await button('Arroz')).click();
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(`${url}/productos/p`))).flush({
      id: 'p',
      nombre: 'Arroz',
      precio: '5',
      stock: '20',
      unidades: [
        { unidadId: 'u', principal: true, factor: '1' },
        { unidadId: 'c', principal: false, factor: '20' },
      ],
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Precio por presentación');
    });
    expect(fixture.nativeElement.querySelector('aside article')?.textContent).toContain('Marca');
    expect(fixture.nativeElement.querySelector('[aria-label="Agregar Arroz"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('S/ 5.00');
    const unidad = fixture.nativeElement.querySelector('#unidad-0') as HTMLSelectElement;
    unidad.value = 'c';
    unidad.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('S/ 100.00');
    unidad.value = 'u';
    unidad.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    (await button('Continuar al cobro')).click();
    fixture.detectChanges();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain('Consumidor final');
    const yape = document.querySelector(
      'input[name="medio-cobro"][value="yape"]',
    ) as HTMLInputElement;
    yape.click();
    fixture.detectChanges();
    expect(document.querySelector('#recibido')).toBeNull();
    (
      document.querySelector('input[name="medio-cobro"][value="efectivo"]') as HTMLInputElement
    ).click();
    fixture.detectChanges();
    expect(document.querySelector('#recibido')).not.toBeNull();
    (
      document.querySelector('input[name="modalidad-cobro"][value="fiado"]') as HTMLInputElement
    ).click();
    fixture.detectChanges();
    expect(document.querySelector('#vencimiento')).not.toBeNull();
    (await button('Registrar fiado')).click();
    fixture.detectChanges();
    expect(document.body.textContent).toContain('Selecciona un cliente para la venta fiada.');
    fixture.detectChanges();
    (await button('Buscar')).click();
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne((r) => r.url === `${url}/personas`))).flush({
      items: [{ id: 'cliente', nombres: 'Ana', apellidos: 'Rojas', estado: 'Activa' }],
      total: 1,
      totalPages: 1,
    });
    (await button('Ana Rojas')).click();
    fixture.detectChanges();
    expect(document.body.textContent).toContain('Ana Rojas');
    expect(document.querySelector('#cliente-busqueda')).toBeNull();
    (await button('Quitar cliente')).click();
    fixture.detectChanges();
    expect(document.body.textContent).toContain('Consumidor final');
    (
      document.querySelector('input[name="modalidad-cobro"][value="contado"]') as HTMLInputElement
    ).click();
    fixture.detectChanges();
    (await button('Volver al detalle')).click();
    fixture.detectChanges();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Precio por presentación');
    (await button('Continuar al cobro')).click();
    fixture.detectChanges();
    const efectivo = document.querySelector('#recibido') as HTMLInputElement;
    efectivo.value = '10';
    efectivo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (await button('Confirmar venta')).click();
    const first = await vi.waitFor(() => http.expectOne(`${url}/ventas`));
    fixture.detectChanges();
    expect(
      (document.querySelector('[aria-label="Cerrar diálogo"]') as HTMLButtonElement).disabled,
    ).toBe(true);
    document
      .querySelector('[role="dialog"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const data = first.request.body;
    expect(data.detalles).toEqual([{ productoId: 'p', unidadId: 'u', cantidad: '1' }]);
    expect(data.pago).toEqual({ medio: 'efectivo', recibido: '10' });
    first.flush({ message: 'Stock insuficiente' }, { status: 409, statusText: 'Conflict' });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(document.body.textContent).toContain('Stock insuficiente');
    });
    expect(fixture.nativeElement.textContent).toContain('Arroz');
    (await button('Confirmar venta')).click();
    const retry = await vi.waitFor(() => http.expectOne(`${url}/ventas`));
    expect(retry.request.body.operacionId).toBe(data.operacionId);
    retry.flush({ id: 'v', total: '5.00', modalidad: 'contado' });
    (await vi.waitFor(() => http.expectOne((r) => r.url === `${url}/productos`))).flush({
      items: [],
      total: 0,
      totalPages: 0,
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(document.body.textContent).toContain('Venta registrada');
    });
    (await vi.waitFor(() => http.expectOne(`${url}/ventas/v/ticket`))).flush({
      id: 'v',
      fecha: '2026-11-13T17:00:00.000Z',
      modalidad: 'contado',
      vencimiento: null,
      total: '5.00',
      empresa: { nombre: 'Mi tienda', direccion: 'Av. Perú' },
      cliente: null,
      detalles: [
        {
          nombre: 'Arroz',
          unidad: 'Unidad',
          cantidad: '1.0000',
          precioUnitario: '5.0000000000',
          importe: '5.00',
        },
      ],
      pago: { medio: 'efectivo', importe: '5.00', recibido: '10.00', vuelto: '5.00' },
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(document.body.textContent).toContain('Mi tienda');
      expect(document.body.textContent).toContain('Vuelto');
    });
    expect(document.body.textContent).toContain('Consumidor final');
    expect(fixture.nativeElement.textContent).toContain('Tu venta está vacía');
    (await button('Cerrar')).click();
  });
  it('filtra categorías en el servidor y muestra alternativa cuando falla la imagen', async () => {
    access.puede = (permiso: string) => permiso === 'categorias.leer';
    const fixture = TestBed.createComponent(PuntoVenta);
    fixture.detectChanges();
    const url = environment.apiUrl;
    (await vi.waitFor(() => http.expectOne((r) => r.url === `${url}/productos`))).flush({
      items: [],
      total: 0,
      totalPages: 0,
    });
    http.expectOne((r) => r.url === `${url}/unidades-medida`).flush({ items: [], totalPages: 0 });
    http
      .expectOne((r) => r.url === `${url}/categorias`)
      .flush({ items: [{ id: 'cat', nombre: 'Herramientas' }], totalPages: 1 });
    const categoria = await vi.waitFor(() => {
      fixture.detectChanges();
      const found = [...fixture.nativeElement.querySelectorAll('button')].find(
        (b: unknown) => (b as HTMLButtonElement).textContent?.trim() === 'Herramientas',
      ) as HTMLButtonElement | undefined;
      expect(found).toBeDefined();
      return found!;
    });
    categoria.click();
    fixture.detectChanges();
    const filtered = await vi.waitFor(() =>
      http.expectOne((r) => r.url === `${url}/productos` && r.params.get('categoriaId') === 'cat'),
    );
    expect(filtered.request.params.get('page')).toBe('1');
    filtered.flush({
      items: [
        {
          id: 'p',
          nombre: 'Martillo',
          marca: 'Marca',
          precio: '5.00',
          stock: '1',
          unidad: 'Unidad',
          imagen: 'https://example.test/a.png',
        },
      ],
      total: 1,
      totalPages: 1,
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });
    (fixture.nativeElement.querySelector('img') as HTMLImageElement).dispatchEvent(
      new Event('error'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Agregar Martillo"] svg'),
    ).not.toBeNull();
  });
});
