/** Códigos del catálogo de la API; no conceden permisos por sí mismos. */
export const PERMISOS = {
  VENTAS: { CREAR: 'ventas.crear', LEER: 'ventas.leer' },
  PRODUCTOS: { LEER: 'productos.leer', CREAR: 'productos.crear', EDITAR: 'productos.editar' },
  CATEGORIAS: {
    LEER: 'categorias.leer',
    CREAR: 'categorias.crear',
    EDITAR: 'categorias.editar',
    ELIMINAR: 'categorias.eliminar',
  },
  MARCAS: {
    LEER: 'marcas.leer',
    CREAR: 'marcas.crear',
    EDITAR: 'marcas.editar',
    ELIMINAR: 'marcas.eliminar',
  },
  UNIDADES_MEDIDA: {
    LEER: 'unidades-medida.leer',
    CREAR: 'unidades-medida.crear',
    EDITAR: 'unidades-medida.editar',
    ELIMINAR: 'unidades-medida.eliminar',
  },
  PERSONAS: {
    LEER: 'personas.leer',
    CREAR: 'personas.crear',
    EDITAR: 'personas.editar',
  },
  EMPRESA: { LEER: 'empresa.leer', EDITAR: 'empresa.editar' },
  USUARIOS: {
    LEER: 'usuarios.leer',
    CREAR: 'usuarios.crear',
    EDITAR: 'usuarios.editar',
    ASIGNAR_ROLES: 'usuarios.asignar-roles',
  },
  ROLES: {
    LEER: 'roles.leer',
    CREAR: 'roles.crear',
    EDITAR: 'roles.editar',
    ELIMINAR: 'roles.eliminar',
    ASIGNAR_PERMISOS: 'roles.asignar-permisos',
  },
  FEATURES: { LEER: 'features.leer' },
  PERMISOS: { LEER: 'permisos.leer' },
} as const;

type Grupos = typeof PERMISOS;
export type Permiso = { [Grupo in keyof Grupos]: Grupos[Grupo][keyof Grupos[Grupo]] }[keyof Grupos];
