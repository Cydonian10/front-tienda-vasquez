import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { environment } from '../../../../../environments/environment';
import { usuariosKeys } from '../../queries/usuarios.keys';
import { UsuarioFormPage } from './usuario-form';

describe('Edición de usuario', () => {
  let http: HttpTestingController;
  let client: QueryClient;
  const user = {
    id: 'u1',
    email: 'ana@example.com',
    nickname: 'Ana',
    personaId: null,
    persona: null,
  };
  beforeEach(() => {
    const params = convertToParamMap({ id: 'u1' });
    client = new QueryClient();
    TestBed.configureTestingModule({
      imports: [UsuarioFormPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: params }, paramMap: of(params) },
        },
        {
          provide: PerfilAccess,
          useValue: { puede: (p: string) => ['usuarios.leer', 'usuarios.editar'].includes(p) },
        },
        { provide: AuthService, useValue: { sessionVersion: 1, userId: () => 'actor' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });
  it('obtiene por ID, conserva el borrador y edita sin enviar contraseña', async () => {
    const fixture = TestBed.createComponent(UsuarioFormPage);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/u1`))).flush(user);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#usuario-nickname')?.value).toBe('Ana');
    });
    const input = fixture.nativeElement.querySelector('#usuario-nickname') as HTMLInputElement;
    input.value = 'Borrador';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    client.setQueryData(usuariosKeys.detalle('u1'), { ...user, nickname: 'Servidor' });
    fixture.detectChanges();
    expect(input.value).toBe('Borrador');
    expect(fixture.nativeElement.querySelector('#usuario-password')).toBeNull();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/u1`));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      nickname: 'Borrador',
      email: 'ana@example.com',
      personaId: null,
    });
    request.flush({ ...user, nickname: 'Borrador' });
    await vi.waitFor(() => expect(TestBed.inject(Router).navigate).toHaveBeenCalled());
  });
});
