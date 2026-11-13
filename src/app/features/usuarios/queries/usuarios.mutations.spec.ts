import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { usuariosKeys } from './usuarios.keys';
import { UsuariosMutations } from './usuarios.mutations';

describe('UsuariosMutations', () => {
  let client: QueryClient;
  let http: HttpTestingController;
  const auth = { sessionVersion: 1, userId: () => 'u1' };
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

  it('ignora la caché cuando una edición termina después de cambiar de sesión', async () => {
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(UsuariosMutations).actualizar());
    const pending = mutation.execute({
      id: 'u1',
      datos: { email: 'ana@example.com', nickname: 'Ana', personaId: null },
    });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/u1`));
    auth.sessionVersion++;
    request.flush({
      id: 'u1',
      email: 'ana@example.com',
      nickname: 'Ana',
      personaId: null,
      persona: null,
    });
    await pending;
    expect(client.getQueryData(usuariosKeys.detalle('u1'))).toBeUndefined();
  });

  it('invalida los roles y el perfil al cambiar los propios roles', async () => {
    client.setQueryData(usuariosKeys.roles('u1'), []);
    client.setQueryData(['perfil', 'u1', 1], { permisos: [] });
    const mutation = client
      .getMutationCache()
      .build(client, TestBed.inject(UsuariosMutations).asignarRoles());
    const pending = mutation.execute({ id: 'u1', rolIds: ['r1'] });
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/u1/roles`));
    expect(request.request.body).toEqual({ rolIds: ['r1'] });
    request.flush([]);
    await pending;
    expect(client.getQueryState(usuariosKeys.roles('u1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(['perfil', 'u1', 1])?.isInvalidated).toBe(true);
  });

  it('no invalida datos de otra sesión al finalizar la creación sensible', () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    TestBed.inject(UsuariosMutations)
      .crear({
        email: 'ana@example.com',
        nickname: 'Ana',
        personaId: null,
        password: 'clave-larga-secreta',
      })
      .subscribe();
    const request = http.expectOne(`${environment.apiUrl}/users/admin`);
    auth.sessionVersion++;
    request.flush({
      id: 'u1',
      email: 'ana@example.com',
      nickname: 'Ana',
      personaId: null,
      persona: null,
    });
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
});
