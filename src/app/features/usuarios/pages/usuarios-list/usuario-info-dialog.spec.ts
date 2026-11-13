import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Subject } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { environment } from '../../../../../environments/environment';
import { UsuarioInfoDialog } from './usuario-info-dialog';

describe('Información y roles de usuario', () => {
  let http: HttpTestingController;
  let client: QueryClient;
  const user = {
    id: 'u1',
    nickname: 'Ana',
    email: 'ana@example.com',
    personaId: null,
    persona: null,
  };
  const actorPermisos = ['usuarios.asignar-roles', 'roles.leer'];
  const sessionCleared = new Subject<void>();
  const dialog = { close: vi.fn() };
  beforeEach(() => {
    client = new QueryClient();
    TestBed.configureTestingModule({
      imports: [UsuarioInfoDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        { provide: DIALOG_DATA, useValue: user },
        { provide: DialogRef, useValue: dialog },
        {
          provide: PerfilAccess,
          useValue: {
            puede: (p: string) => actorPermisos.includes(p),
            perfil: { data: () => ({ permisos: actorPermisos }) },
          },
        },
        {
          provide: AuthService,
          useValue: { sessionVersion: 1, userId: () => 'actor', sessionCleared },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });
  it('muestra y bloquea roles superiores que el actor no puede administrar', async () => {
    const fixture = TestBed.createComponent(UsuarioInfoDialog);
    fixture.detectChanges();
    const role = {
      id: 'r1',
      nombre: 'Gerente',
      activo: true,
      sistema: false,
      permisos: [{ id: 'p1', codigo: 'empresa.editar', nombre: 'Editar empresa' }],
    };
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/u1/roles`))).flush([role]);
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles`))).flush([role]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('roles que superan tus permisos');
    });
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((item: any) =>
      item.textContent?.includes('Guardar roles'),
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    http.expectNone(`${environment.apiUrl}/personas/`);
  });

  it('cierra el diálogo al limpiar la sesión', async () => {
    dialog.close.mockClear();
    const fixture = TestBed.createComponent(UsuarioInfoDialog);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/users/u1/roles`))).flush([]);
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles`))).flush([]);
    sessionCleared.next();
    expect(dialog.close).toHaveBeenCalledOnce();
  });
});
