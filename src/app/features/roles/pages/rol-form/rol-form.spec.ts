import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { environment } from '../../../../../environments/environment';
import { RolFormPage } from './rol-form';

describe('RolFormPage', () => {
  let http: HttpTestingController;
  let client: QueryClient;
  const permisos = [
    'roles.leer',
    'roles.editar',
    'roles.asignar-permisos',
    'features.leer',
    'personas.leer',
  ];
  const params = convertToParamMap({ id: 'r-1' });
  const leer = {
    id: 'p-1',
    nombre: 'Leer personas',
    codigo: 'personas.leer',
    descripcion: null,
    featureId: 'f-1',
  };
  const editar = {
    id: 'p-2',
    nombre: 'Editar personas',
    codigo: 'personas.editar',
    descripcion: null,
    featureId: 'f-1',
  };
  const role = {
    id: 'r-1',
    nombre: 'Vendedor',
    descripcion: null,
    activo: true,
    sistema: false,
    permisos: [leer],
  };
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      imports: [RolFormPage],
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
          useValue: {
            puede: (p: string) => permisos.includes(p),
            perfil: { data: () => ({ permisos }) },
          },
        },
        { provide: AuthService, useValue: { sessionVersion: 1 } },
      ],
    });
  });
  afterEach(() => {
    http.verify();
    client.clear();
    TestBed.resetTestingModule();
  });

  it('selecciona permisos antes de crear y conserva los datos al volver al primer paso', async () => {
    const empty = convertToParamMap({});
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: empty }, paramMap: of(empty) },
    });
    TestBed.overrideProvider(PerfilAccess, {
      useValue: {
        puede: (codigo: string) =>
          ['roles.leer', 'roles.crear', 'roles.asignar-permisos', 'features.leer'].includes(codigo),
        perfil: { data: () => ({ permisos: ['personas.leer'] }) },
      },
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RolFormPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    [...element.querySelectorAll<HTMLButtonElement>('nav button')]
      .find((button) => button.textContent?.includes('Asignar permisos'))!
      .click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Ingresa un nombre para el rol');
    http.expectNone(`${environment.apiUrl}/features`);
    expect(element.querySelector('a[href="/admin/roles-permisos"]')?.textContent).toContain(
      'Volver',
    );
    expect(
      [...element.querySelectorAll('a')]
        .find((a) => a.textContent?.includes('Cancelar'))
        ?.getAttribute('href'),
    ).toBe('/admin/roles-permisos');

    const name = element.querySelector('#rol-nombre') as HTMLInputElement;
    name.value = 'Vendedor';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    http.expectNone(`${environment.apiUrl}/roles`);
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/features`))).flush([
      { id: 'f-1', nombre: 'Personas', codigo: 'personas', permisos: [leer, editar] },
    ]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.textContent).toContain('Leer personas');
    });
    const checkboxes = element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes[1].disabled).toBe(true);
    checkboxes[0].click();
    fixture.detectChanges();
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Anterior'))!
      .click();
    fixture.detectChanges();
    expect((element.querySelector('#rol-nombre') as HTMLInputElement).value).toBe('Vendedor');
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(true);
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Crear rol')!
      .click();
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles`));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Vendedor',
      descripcion: null,
      activo: true,
      permisoIds: ['p-1'],
    });
    fixture.detectChanges();
    expect(
      [...element.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Creando'),
      )?.disabled,
    ).toBe(true);
    request.flush(role);
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(['/admin/roles-permisos/r-1'], {
        state: { rolMessage: 'Rol creado correctamente.' },
      }),
    );
  });

  it('permite crear sin permisos cuando no puede asignarlos ni leer el catálogo', async () => {
    const empty = convertToParamMap({});
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: empty }, paramMap: of(empty) },
    });
    TestBed.overrideProvider(PerfilAccess, {
      useValue: {
        puede: (codigo: string) => codigo === 'roles.crear',
        perfil: { data: () => ({ permisos: [] }) },
      },
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RolFormPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const name = element.querySelector('#rol-nombre') as HTMLInputElement;
    name.value = 'Consulta';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(element.textContent).toContain('No tienes permiso para asignar permisos');
    http.expectNone(`${environment.apiUrl}/features`);
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Crear rol')!
      .click();
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles`));
    expect(request.request.body.permisoIds).toEqual([]);
    request.flush({ ...role, permisos: [] });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/admin'], expect.anything()));
  });

  it('no crea mientras el catálogo falla y permite reintentar', async () => {
    const empty = convertToParamMap({});
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: empty }, paramMap: of(empty) },
    });
    TestBed.overrideProvider(PerfilAccess, {
      useValue: {
        puede: (codigo: string) =>
          ['roles.crear', 'roles.asignar-permisos', 'features.leer'].includes(codigo),
        perfil: { data: () => ({ permisos: ['personas.leer'] }) },
      },
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RolFormPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const name = element.querySelector('#rol-nombre') as HTMLInputElement;
    name.value = 'Consulta';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/features`))).flush('error', {
      status: 403,
      statusText: 'Forbidden',
    });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.textContent).toContain('No se pudo cargar el catálogo');
    });
    const create = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Crear rol',
    )!;
    expect(create.disabled).toBe(true);
    http.expectNone(`${environment.apiUrl}/roles`);
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/features`))).flush([]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(create.disabled).toBe(false);
    });
  });

  it('rechaza permisos seleccionados que el actor deja de poseer', async () => {
    const codes = signal([
      'roles.crear',
      'roles.asignar-permisos',
      'features.leer',
      'personas.leer',
    ]);
    const empty = convertToParamMap({});
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: empty }, paramMap: of(empty) },
    });
    TestBed.overrideProvider(PerfilAccess, {
      useValue: {
        puede: (codigo: string) => codes().includes(codigo),
        perfil: { data: () => ({ permisos: codes() }) },
      },
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RolFormPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const name = element.querySelector('#rol-nombre') as HTMLInputElement;
    name.value = 'Consulta';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/features`))).flush([
      { id: 'f-1', nombre: 'Personas', codigo: 'personas', permisos: [leer] },
    ]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('input[type="checkbox"]')).toBeTruthy();
    });
    element.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    codes.set(['roles.crear', 'roles.asignar-permisos', 'features.leer']);
    fixture.detectChanges();
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === 'Crear rol')!
      .click();
    fixture.detectChanges();
    expect(element.textContent).toContain('ya no están disponibles para tu cuenta');
    http.expectNone(`${environment.apiUrl}/roles`);
    [...element.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Limpiar selección'))!
      .click();
    fixture.detectChanges();
    expect(element.textContent).not.toContain('ya no están disponibles para tu cuenta');
    expect(element.textContent).toContain('0 seleccionados');
  });

  it('muestra permisos agrupados y no permite conceder un permiso superior', async () => {
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RolFormPage);
    fixture.detectChanges();
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r-1`))).flush(role);
    (await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/features`))).flush([
      { id: 'f-1', nombre: 'Personas', codigo: 'personas', permisos: [leer, editar] },
    ]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Editar personas');
    });
    const labels = [...fixture.nativeElement.querySelectorAll('label')] as HTMLLabelElement[];
    const leerBox = labels
      .find((label) => label.textContent?.includes('Leer personas'))!
      .querySelector('input')!;
    const editarBox = labels
      .find((label) => label.textContent?.includes('Editar personas'))!
      .querySelector('input')!;
    expect(leerBox.checked).toBe(true);
    expect(editarBox.disabled).toBe(true);
    leerBox.click();
    fixture.detectChanges();
    const save = [...fixture.nativeElement.querySelectorAll('button')].find((button: any) =>
      button.textContent?.includes('Guardar permisos'),
    ) as HTMLButtonElement;
    save.click();
    const write = await vi.waitFor(() =>
      http.expectOne(`${environment.apiUrl}/roles/r-1/permisos`),
    );
    expect(write.request.body).toEqual({ permisoIds: [] });
    write.flush({ ...role, permisos: [] });
    const refetch = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/roles/r-1`));
    refetch.flush({ ...role, permisos: [] });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Permisos actualizados');
    });
  });
});
