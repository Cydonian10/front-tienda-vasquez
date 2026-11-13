import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { rolesKeys } from './roles.keys';
import { RolesMutations } from './roles.mutations';

describe('RolesMutations', () => {
  let client: QueryClient;
  let http: HttpTestingController;
  const auth = { sessionVersion: 1 };
  const role = {
    id: 'r1',
    nombre: 'Vendedor',
    descripcion: null,
    activo: true,
    sistema: false,
    permisos: [],
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
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });

  it('invalida rol, usuarios y perfil al modificar permisos', async () => {
    client.setQueryData(rolesKeys.detalle('r1'), role);
    client.setQueryData(rolesKeys.lista, [role]);
    client.setQueryData(['usuarios', 'roles', 'u1'], []);
    client.setQueryData(['perfil', 'u1', 1], { permisos: [] });
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).asignarPermisos());
    const pending = mutation.execute({ id: 'r1', permisoIds: [] });
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r1/permisos`))).flush(role);
    await pending;
    for (const key of [
      rolesKeys.detalle('r1'),
      rolesKeys.lista,
      ['usuarios', 'roles', 'u1'],
      ['perfil', 'u1', 1],
    ]) {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    }
  });

  it('no invalida ni restaura datos de otra sesión', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).asignarPermisos());
    const pending = mutation.execute({ id: 'r1', permisoIds: [] });
    const request = await vi.waitFor(() =>
      http.expectOne(`${environment.apiUrl}/roles/r1/permisos`),
    );
    auth.sessionVersion++;
    request.flush(role);
    await pending;
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getQueryData(rolesKeys.detalle('r1'))).toBeUndefined();
  });

  it('crea con los permisos indicados sin invalidar la caché de una sesión posterior', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).crear());
    const pending = mutation.execute({
      nombre: 'Vendedor',
      descripcion: null,
      activo: true,
      permisoIds: ['p1'],
    });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles`));
    expect(request.request.method).toBe('POST');
    expect(request.request.body.permisoIds).toEqual(['p1']);
    auth.sessionVersion++;
    request.flush(role);
    await pending;
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('elimina la entrada individual y actualiza solo la lista de roles al borrar', async () => {
    client.setQueryData(rolesKeys.lista, [role]);
    client.setQueryData(rolesKeys.detalle('r1'), role);
    client.setQueryData(rolesKeys.detalle('otro'), { ...role, id: 'otro' });
    client.setQueryData(['perfil', 'u1', 1], { permisos: [] });
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).eliminar());
    const pending = mutation.execute('r1');
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r1`));
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await pending;
    expect(client.getQueryData(rolesKeys.lista)).toEqual([]);
    expect(client.getQueryState(rolesKeys.lista)?.isInvalidated).toBe(true);
    expect(client.getQueryData(rolesKeys.detalle('r1'))).toBeUndefined();
    expect(client.getQueryData(rolesKeys.detalle('otro'))).toBeTruthy();
    expect(client.getQueryState(['perfil', 'u1', 1])?.isInvalidated).toBe(false);
  });

  it('no modifica la caché si falla el borrado', async () => {
    client.setQueryData(rolesKeys.lista, [role]);
    client.setQueryData(rolesKeys.detalle('r1'), role);
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).eliminar());
    const pending = mutation.execute('r1');
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r1`))).flush(
      { message: 'Asignado' },
      { status: 409, statusText: 'Conflict' },
    );
    await expect(pending).rejects.toBeTruthy();
    expect(client.getQueryData(rolesKeys.lista)).toEqual([role]);
    expect(client.getQueryData(rolesKeys.detalle('r1'))).toEqual(role);
    http.expectNone(`${environment.apiUrl}/roles/r1`);
  });

  it('no elimina ni invalida caché de una sesión posterior', async () => {
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).eliminar());
    const pending = mutation.execute('r1');
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r1`));
    auth.sessionVersion++;
    client.setQueryData(rolesKeys.lista, [role]);
    client.setQueryData(rolesKeys.detalle('r1'), role);
    request.flush(null, { status: 204, statusText: 'No Content' });
    await pending;
    expect(client.getQueryData(rolesKeys.lista)).toEqual([role]);
    expect(client.getQueryData(rolesKeys.detalle('r1'))).toEqual(role);
    expect(client.getQueryState(rolesKeys.lista)?.isInvalidated).toBe(false);
  });

  it('detiene la limpieza si la sesión cambia durante la cancelación', async () => {
    let continuar!: () => void;
    const cancel = vi.spyOn(client, 'cancelQueries').mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          continuar = resolve;
        }),
    );
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(RolesMutations).eliminar());
    const pending = mutation.execute('r1');
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r1`))).flush(null, {
      status: 204,
      statusText: 'No Content',
    });
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce());
    auth.sessionVersion++;
    client.setQueryData(rolesKeys.lista, [role]);
    client.setQueryData(rolesKeys.detalle('r1'), role);
    continuar();
    await pending;
    expect(cancel).toHaveBeenCalledOnce();
    expect(client.getQueryData(rolesKeys.lista)).toEqual([role]);
    expect(client.getQueryData(rolesKeys.detalle('r1'))).toEqual(role);
  });
});
