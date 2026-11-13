import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import type { VentaDatos } from '../models/venta.model';
import { ventasKeys } from './ventas.keys';
import { VentasMutations } from './ventas.mutations';

describe('VentasMutations', () => {
  let client: QueryClient;
  let http: HttpTestingController;
  const auth = { sessionVersion: 1 };
  const datos: VentaDatos = {
    operacionId: 'operacion',
    modalidad: 'fiado',
    clienteId: 'cliente',
    vencimiento: null,
    detalles: [{ productoId: 'producto', unidadId: 'unidad', cantidad: '1' }],
  };
  beforeEach(() => {
    auth.sessionVersion = 1;
    client = new QueryClient();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        { provide: AuthService, useValue: auth },
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
  it('invalida catálogos y detalles de productos al registrar una venta', async () => {
    const lista = ventasKeys.productosLista(1, '', '');
    const detalle = ventasKeys.productoDetalle('producto');
    client.setQueryData(lista, {});
    client.setQueryData(detalle, {});
    client.setQueryData(['productos', 'lista'], {});
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(VentasMutations).crear());
    const pending = mutation.execute(datos);
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/ventas`))).flush({ id: 'venta' });
    await pending;
    expect(client.getQueryState(lista)?.isInvalidated).toBe(true);
    expect(client.getQueryState(detalle)?.isInvalidated).toBe(true);
    expect(client.getQueryState(['productos', 'lista'])?.isInvalidated).toBe(true);
  });
  it('no invalida la caché de otra sesión ante una respuesta tardía', async () => {
    const spy = vi.spyOn(client, 'invalidateQueries');
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(VentasMutations).crear());
    const pending = mutation.execute(datos);
    const req = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/ventas`));
    auth.sessionVersion++;
    req.flush({ id: 'venta' });
    await pending;
    expect(spy).not.toHaveBeenCalled();
  });
});
