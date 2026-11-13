import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { UnidadesMedidaMutations } from './unidades-medida.mutations';
import { unidadesMedidaKeys } from './unidades-medida.keys';

describe('UnidadesMedidaMutations', () => {
  let client: QueryClient;
  let http: HttpTestingController;
  let mutations: UnidadesMedidaMutations;
  const auth = { sessionVersion: 1 };
  const unidad = { id: '1', nombre: 'Kilogramo', abreviatura: 'kg' };
  const lista = unidadesMedidaKeys.list(1, 8, '');
  beforeEach(() => {
    auth.sessionVersion = 1;
    client = new QueryClient();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: QueryClient, useValue: client },
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    mutations = TestBed.inject(UnidadesMedidaMutations);
    client.setQueryData(lista, { items: [unidad] });
  });
  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });
  it('actualiza el detalle e invalida el listado al guardar', async () => {
    const pending = client
      .getMutationCache()
      .build(client, mutations.guardar())
      .execute({ id: '1', datos: { nombre: 'Kilogramo', abreviatura: 'kg' } });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/unidades-medida/1`));
    request.flush(unidad);
    await pending;
    expect(client.getQueryData(unidadesMedidaKeys.detail('1'))).toEqual(unidad);
    expect(client.getQueryState(lista)?.isInvalidated).toBe(true);
  });
  it('elimina el detalle e invalida el listado', async () => {
    client.setQueryData(unidadesMedidaKeys.detail('1'), unidad);
    const pending = client.getMutationCache().build(client, mutations.eliminar()).execute('1');
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/unidades-medida/1`));
    request.flush(null);
    await pending;
    expect(client.getQueryData(unidadesMedidaKeys.detail('1'))).toBeUndefined();
    expect(client.getQueryState(lista)?.isInvalidated).toBe(true);
  });
  it('ignora una respuesta de guardado de otra sesión', async () => {
    const pending = client
      .getMutationCache()
      .build(client, mutations.guardar())
      .execute({ id: '', datos: { nombre: 'Kilogramo', abreviatura: 'kg' } });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/unidades-medida`));
    auth.sessionVersion++;
    request.flush(unidad);
    await pending;
    expect(client.getQueryData(unidadesMedidaKeys.detail('1'))).toBeUndefined();
    expect(client.getQueryState(lista)?.isInvalidated).toBe(false);
  });
});
