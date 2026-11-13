export const usuariosKeys = {
  all: ['usuarios'] as const,
  lista: ['usuarios', 'lista'] as const,
  detalle: (id: string) => ['usuarios', 'detalle', id] as const,
  roles: (id: string) => ['usuarios', 'roles', id] as const,
  rolesCatalogo: ['usuarios', 'roles-catalogo'] as const,
  personas: (page: number, nombre: string) => ['usuarios', 'personas', page, nombre] as const,
  persona: (id: string) => ['usuarios', 'persona', id] as const,
};
