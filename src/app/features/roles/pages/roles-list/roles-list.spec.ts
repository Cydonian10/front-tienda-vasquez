import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Subject } from 'rxjs';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../../environments/environment';
import { Rol } from '../../models/rol.model';
import { rolesKeys } from '../../queries/roles.keys';
import { RolesListPage } from './roles-list';

const url = `${environment.apiUrl}/roles`;
const administrador: Rol = {
  id: 'r1',
  nombre: 'Administrador',
  descripcion: 'Gestiona los accesos.',
  activo: true,
  sistema: true,
  permisos: [
    {
      id: 'p1',
      codigo: 'personas.leer',
      nombre: 'Leer personas',
      descripcion: null,
      featureId: 'personas',
    },
    {
      id: 'p2',
      codigo: 'roles.editar',
      nombre: 'Editar roles',
      descripcion: null,
      featureId: 'roles',
    },
  ],
};
const vendedor: Rol = {
  id: 'r2',
  nombre: 'Vendedor',
  descripcion: null,
  activo: false,
  sistema: false,
  permisos: [],
};

describe('RolesListPage', () => {
  const permisos = signal<string[]>([]);
  let http: HttpTestingController;
  let client: QueryClient;
  const sessionCleared = new Subject<void>();
  const auth = { sessionVersion: 1, sessionCleared };

  beforeEach(() => {
    permisos.set(['roles.leer']);
    auth.sessionVersion = 1;
    client = new QueryClient();
    TestBed.configureTestingModule({
      imports: [RolesListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        { provide: AuthService, useValue: auth },
        {
          provide: PerfilAccess,
          useValue: { puede: (codigo: string) => permisos().includes(codigo) },
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

  async function setup(roles: Rol[]) {
    const fixture = TestBed.createComponent(RolesListPage);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(url))).flush(roles);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-pagination')).toBeTruthy();
    });
    return fixture;
  }

  it('muestra los permisos, estados y detalles reales sin ofrecer crear sin permiso', async () => {
    const fixture = await setup([administrador, vendedor]);
    const element = fixture.nativeElement as HTMLElement;
    const roles = element.querySelectorAll('article');

    expect(element.textContent).toContain('2 roles en total');
    expect(roles[0].textContent).toContain('Administrador');
    expect(roles[0].textContent).toContain('Activo');
    expect(roles[0].querySelector('.roles-active-status')?.classList.contains('text-success')).toBe(
      true,
    );
    expect(roles[0].textContent).toContain('Protegido');
    expect(roles[0].textContent).toContain('Leer personas');
    expect(roles[0].textContent).toContain('Editar roles');
    expect(roles[0].querySelector('[title="personas.leer"]')).toBeTruthy();
    expect(roles[0].querySelector('a')?.getAttribute('href')).toBe('/admin/roles-permisos/r1');
    expect(roles[0].querySelector('a')?.getAttribute('aria-label')).toBe(
      'Ver detalle del rol Administrador',
    );
    expect(roles[1].textContent).toContain('Inactivo');
    expect(roles[1].textContent).toContain('Sin descripción.');
    expect(roles[1].textContent).toContain('Sin permisos asignados');
    expect(element.querySelector('a[href="/admin/roles-permisos/nuevo"]')).toBeNull();
    expect(element.querySelector('button[aria-label^="Eliminar rol"]')).toBeNull();
  });

  it('solo ofrece eliminar roles no protegidos y permite cancelar la confirmación', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([administrador, vendedor]);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[aria-label="Eliminar rol Administrador"]')).toBeNull();
    (element.querySelector('[aria-label="Eliminar rol Vendedor"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Vendedor');
    expect(dialog.textContent).toContain('asignado a ningún usuario');
    (dialog.querySelector('#cancelar-eliminar-rol') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    http.expectNone(`${url}/r2`);
  });

  it('elimina tras confirmar y actualiza el listado', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([administrador, vendedor]);
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('[aria-label="Eliminar rol Vendedor"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    [...dialog.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Eliminar rol')!
      .click();
    const request = await vi.waitFor(() => http.expectOne(`${url}/r2`));
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    (await vi.waitFor(() => http.expectOne(url))).flush([administrador]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.textContent).toContain('El rol «Vendedor» se eliminó correctamente.');
      expect(element.textContent).not.toContain('Sin permisos asignados');
    });
    expect(element.textContent).toContain('Administrador');
  });

  it('muestra el conflicto sin retirar un rol que aún está asignado', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([vendedor]);
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('[aria-label="Eliminar rol Vendedor"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    [...dialog.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Eliminar rol')!
      .click();
    (await vi.waitFor(() => http.expectOne(`${url}/r2`))).flush(
      { message: 'El rol está asignado a usuarios' },
      { status: 409, statusText: 'Conflict' },
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')?.textContent).toContain('asignado a usuarios');
    });
    expect(element.textContent).toContain('Vendedor');
    http.expectNone(`${url}/r2`);
  });

  it('informa cuando la API rechaza la eliminación por permisos', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([vendedor]);
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('[aria-label="Eliminar rol Vendedor"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    [...dialog.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Eliminar rol')!
      .click();
    (await vi.waitFor(() => http.expectOne(`${url}/r2`))).flush(
      { message: 'Prohibido' },
      { status: 403, statusText: 'Forbidden' },
    );
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')?.textContent).toContain(
        'no posees todos sus permisos',
      );
    });
    expect(element.textContent).toContain('Vendedor');
  });

  it('no envía la eliminación si el rol desaparece del listado durante la confirmación', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([vendedor]);
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Eliminar rol Vendedor"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    client.setQueryData(rolesKeys.lista, []);
    fixture.detectChanges();
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    [...dialog.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Eliminar rol')!
      .click();
    http.expectNone(`${url}/r2`);
  });

  it('no elimina si se revoca el permiso mientras está abierta la confirmación', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([vendedor]);
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Eliminar rol Vendedor"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    permisos.set(['roles.leer']);
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    [...dialog.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Eliminar rol')!
      .click();
    fixture.detectChanges();
    http.expectNone(`${url}/r2`);
  });

  it('cierra la confirmación al finalizar la sesión', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([vendedor]);
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Eliminar rol Vendedor"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(document.querySelector('[role="alertdialog"]')).toBeTruthy();
    auth.sessionVersion++;
    sessionCleared.next();
    fixture.detectChanges();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    http.expectNone(`${url}/r2`);
  });

  it('ignora una respuesta de eliminación de una sesión anterior', async () => {
    permisos.set(['roles.leer', 'roles.eliminar']);
    const fixture = await setup([vendedor]);
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('[aria-label="Eliminar rol Vendedor"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialog = document.querySelector('[role="alertdialog"]') as HTMLElement;
    [...dialog.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Eliminar rol')!
      .click();
    const request = await vi.waitFor(() => http.expectOne(`${url}/r2`));
    auth.sessionVersion++;
    sessionCleared.next();
    client.setQueryData(rolesKeys.lista, [vendedor]);
    request.flush(null, { status: 204, statusText: 'No Content' });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        (element.querySelector('[aria-label="Eliminar rol Vendedor"]') as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
    expect(element.textContent).not.toContain('se eliminó correctamente');
    expect(client.getQueryData(rolesKeys.lista)).toEqual([vendedor]);
    http.expectNone(url);
  });

  it('permite crear un rol cuando existe el permiso, incluso con la lista vacía', async () => {
    permisos.set(['roles.leer', 'roles.crear']);
    const fixture = await setup([]);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Aún no hay roles registrados');
    expect(element.querySelectorAll('a[href="/admin/roles-permisos/nuevo"]')).toHaveLength(2);
    expect(element.textContent).toContain('Crear primer rol');
  });

  it('no ofrece crear en el estado vacío sin autorización y trata los espacios como búsqueda vacía', async () => {
    const fixture = await setup([]);
    const element = fixture.nativeElement as HTMLElement;
    const search = element.querySelector('input[type="search"]') as HTMLInputElement;

    search.value = '   ';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Aún no hay roles registrados');
    expect(element.textContent).not.toContain('No encontramos roles');
    expect(element.querySelector('a[href="/admin/roles-permisos/nuevo"]')).toBeNull();
  });

  it('filtra por descripción, reinicia la página y distingue una búsqueda sin resultados', async () => {
    const roles = Array.from({ length: 10 }, (_, index): Rol => ({
      ...vendedor,
      id: `rol-${index + 1}`,
      nombre: `Rol ${index + 1}`,
      descripcion: index === 0 ? 'Gestiona inventario' : null,
    }));
    const fixture = await setup(roles);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('[aria-label="Página 2"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Rol 9');
    expect(element.querySelector('article')?.textContent).not.toContain('Rol 1');

    const search = element.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = '  INVENTARIO  ';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.textContent).toContain('1 rol en la búsqueda');
    expect(element.querySelector('article')?.textContent).toContain('Rol 1');
    expect(element.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe(
      'Página 1',
    );

    search.value = 'sin coincidencias';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.textContent).toContain('No encontramos roles');
    expect(element.textContent).not.toContain('Aún no hay roles registrados');

    search.value = 'rOL 10';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('article')).toHaveLength(1);
    expect(element.querySelector('article')?.textContent).toContain('Rol 10');
  });

  it('muestra la carga y permite reintentar un error sin presentarlo como lista vacía', async () => {
    const fixture = TestBed.createComponent(RolesListPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando roles');
    expect(element.textContent).not.toContain('0 roles en total');

    (await vi.waitFor(() => http.expectOne(url))).flush('error', {
      status: 403,
      statusText: 'Forbidden',
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"]')?.textContent).toContain(
        'No se pudieron cargar los roles',
      );
    });
    expect(element.textContent).not.toContain('Aún no hay roles registrados');

    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    (await vi.waitFor(() => http.expectOne(url))).flush([administrador]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.textContent).toContain('Administrador');
    });
  });
});
