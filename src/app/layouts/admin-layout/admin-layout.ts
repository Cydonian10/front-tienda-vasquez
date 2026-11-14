import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBarChart3,
  LucideBox,
  LucideBuilding2,
  LucideChevronDown,
  LucideCircleHelp,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucideSettings,
  LucideShoppingCart,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS, Permiso } from '@/core/access-control/permissions';

type MenuIcon = 'home' | 'box' | 'cart' | 'users' | 'chart' | 'settings' | 'help' | 'building';
interface MenuItem {
  label: string;
  icon: MenuIcon;
  path?: string;
  permiso?: Permiso;
  children?: { label: string; path: string; permiso?: Permiso }[];
}
interface MenuSection {
  label: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-admin-layout',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideBarChart3,
    LucideBox,
    LucideBuilding2,
    LucideChevronDown,
    LucideCircleHelp,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideMenu,
    LucideSettings,
    LucideShoppingCart,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  protected readonly access = inject(PerfilAccess);
  protected readonly sidebarOpen = signal(false);
  protected readonly expanded = signal<readonly string[]>([]);
  private readonly menu: MenuSection[] = [
    { label: 'General', items: [{ label: 'Inicio', icon: 'home', path: '/admin' }] },
    {
      label: 'Espacio de trabajo',
      items: [
        {
          label: 'Inventario',
          icon: 'box',
          children: [
            { label: 'Productos', path: '/admin/productos', permiso: PERMISOS.PRODUCTOS.LEER },
            { label: 'Categorías', path: '/admin/categorias', permiso: PERMISOS.CATEGORIAS.LEER },
            { label: 'Marcas', path: '/admin/marcas', permiso: PERMISOS.MARCAS.LEER },
            {
              label: 'Unidades de medida',
              path: '/admin/unidades-medida',
              permiso: PERMISOS.UNIDADES_MEDIDA.LEER,
            },
          ],
        },
        {
          label: 'Ventas',
          icon: 'cart',
          children: [
            { label: 'Todas las ventas', path: '/admin/ventas', permiso: PERMISOS.VENTAS.LEER },
            { label: 'Nueva venta', path: '/admin/ventas/nueva', permiso: PERMISOS.VENTAS.CREAR },
          ],
        },
      ],
    },
    {
      label: 'Administración',
      items: [
        {
          label: 'Empresa',
          icon: 'building',
          path: '/admin/empresa',
          permiso: PERMISOS.EMPRESA.LEER,
        },
        {
          label: 'Personas',
          icon: 'users',
          path: '/admin/personas',
          permiso: PERMISOS.PERSONAS.LEER,
        },
        {
          label: 'Accesos',
          icon: 'settings',
          children: [
            { label: 'Usuarios', path: '/admin/usuarios', permiso: PERMISOS.USUARIOS.LEER },
            {
              label: 'Roles y permisos',
              path: '/admin/roles-permisos',
              permiso: PERMISOS.ROLES.LEER,
            },
          ],
        },
      ],
    },
  ];

  protected readonly sections = computed(() =>
    this.menu
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => !item.permiso || this.access.puede(item.permiso))
          .map((item) => ({
            ...item,
            children: item.children?.filter(
              (child) => !child.permiso || this.access.puede(child.permiso),
            ),
          }))
          .filter((item) => !item.children || item.children.length > 0),
      }))
      .filter((section) => section.items.length > 0),
  );

  protected toggleGroup(label: string): void {
    this.expanded.update((open) =>
      open.includes(label) ? open.filter((item) => item !== label) : [...open, label],
    );
  }

  protected logout(): void {
    this.auth.logout();
  }
}
