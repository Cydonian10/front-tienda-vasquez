import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { signal } from '@angular/core';
import { AdminLayout } from './admin-layout';

describe('Admin layout', () => {
  const auth = { logout: vi.fn() };
  const permisos = signal<string[]>([]);
  const access = {
    perfil: { isPending: () => false, isError: () => false, data: () => ({ nickname: 'Ana' }) },
    puede: (permiso: string) => permisos().includes(permiso),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    permisos.set([
      'productos.leer',
      'personas.leer',
      'empresa.leer',
      'usuarios.leer',
      'roles.leer',
    ]);
    TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: PerfilAccess, useValue: access },
      ],
    });
  });

  it('renders the menu and allows groups to be collapsed', () => {
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Productos');
    const inventory = [...element.querySelectorAll<HTMLButtonElement>('.nav-item')].find((button) =>
      button.textContent?.includes('Inventario'),
    )!;
    expect(inventory.getAttribute('aria-expanded')).toBe('false');
    const subnav = inventory.nextElementSibling!;
    expect(subnav.hasAttribute('inert')).toBe(true);
    expect((subnav as HTMLElement).style.maxHeight).toBe('0px');
    inventory.click();
    fixture.detectChanges();
    expect(subnav.hasAttribute('inert')).toBe(false);
    expect((subnav as HTMLElement).style.maxHeight).toBe('40px');
    inventory.click();
    fixture.detectChanges();
    expect(inventory.getAttribute('aria-expanded')).toBe('false');
    expect(subnav.hasAttribute('inert')).toBe(true);
  });

  it('muestra cada catálogo solo con su permiso de lectura', () => {
    permisos.set(['categorias.leer', 'marcas.leer', 'unidades-medida.leer']);
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Categorías');
    expect(element.textContent).toContain('Marcas');
    expect(element.textContent).toContain('Unidades de medida');
    permisos.set([]);
    fixture.detectChanges();
    expect(element.textContent).not.toContain('Categorías');
    expect(element.textContent).not.toContain('Marcas');
    expect(element.textContent).not.toContain('Unidades de medida');
  });

  it('opens the mobile menu and closes the session', () => {
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.menu-toggle')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.sidebar')?.classList.contains('sidebar-open')).toBe(true);
    element.querySelector<HTMLButtonElement>('.logout')!.click();
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('filtra menús y grupos vacíos cuando cambian los permisos', () => {
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Personas');
    expect(element.textContent).toContain('Empresa');
    expect(element.textContent).toContain('Accesos');
    permisos.set([]);
    fixture.detectChanges();
    expect(element.textContent).not.toContain('Personas');
    expect(element.textContent).not.toContain('Empresa');
    expect(element.textContent).not.toContain('Accesos');
  });

  it('no muestra accesos de creación en el menú lateral', () => {
    permisos.set(['usuarios.crear', 'roles.crear']);
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain('Nuevo usuario');
    expect(element.textContent).not.toContain('Crear rol');
    expect(element.textContent).not.toContain('Roles y permisos');
    expect(element.querySelector('a[href="/admin/usuarios/nuevo"]')).toBeNull();
    expect(element.querySelector('a[href="/admin/roles-permisos/nuevo"]')).toBeNull();
  });
});
