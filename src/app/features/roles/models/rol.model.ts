export interface PermisoRol {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  featureId: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  sistema: boolean;
  permisos: PermisoRol[];
}

export interface RolDatos {
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface NuevoRol extends RolDatos {
  permisoIds: string[];
}

export interface GrupoPermisos {
  id: string;
  codigo: string;
  nombre: string;
  permisos: PermisoRol[];
}
