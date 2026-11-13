import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { CategoriasMutations } from './categorias.mutations';
import { categoriasKeys } from './categorias.keys';

describe('CategoriasMutations', () => {
  let client: QueryClient;
  let http: HttpTestingController;
  let mutations: CategoriasMutations;
  const auth = { sessionVersion: 1 };
  const categoria = { id: '1', nombre: 'Bebidas', descripcion: null };
  const lista = categoriasKeys.list(1, 8, '');
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
    mutations = TestBed.inject(CategoriasMutations);
    client.setQueryData(lista, { items: [categoria] });
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
      .execute({ id: '1', datos: { nombre: 'Bebidas', descripcion: null } });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/categorias/1`));
    request.flush(categoria);
    await pending;
    expect(client.getQueryData(categoriasKeys.detail('1'))).toEqual(categoria);
    expect(client.getQueryState(lista)?.isInvalidated).toBe(true);
  });
  it('elimina el detalle e invalida el listado', async () => {
    client.setQueryData(categoriasKeys.detail('1'), categoria);
    const pending = client.getMutationCache().build(client, mutations.eliminar()).execute('1');
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/categorias/1`));
    request.flush(null);
    await pending;
    expect(client.getQueryData(categoriasKeys.detail('1'))).toBeUndefined();
    expect(client.getQueryState(lista)?.isInvalidated).toBe(true);
  });
  it('ignora una respuesta de guardado de otra sesión', async () => {
    const pending = client
      .getMutationCache()
      .build(client, mutations.guardar())
      .execute({ id: '', datos: { nombre: 'Bebidas', descripcion: null } });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/categorias`));
    auth.sessionVersion++;
    request.flush(categoria);
    await pending;
    expect(client.getQueryData(categoriasKeys.detail('1'))).toBeUndefined();
    expect(client.getQueryState(lista)?.isInvalidated).toBe(false);
  });
});
