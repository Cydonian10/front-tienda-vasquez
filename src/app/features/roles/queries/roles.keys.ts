export const rolesKeys = {
  all: ['roles'] as const,
  lista: ['roles', 'lista'] as const,
  detalle: (id: string) => ['roles', 'detalle', id] as const,
  catalogo: (origen: string) => ['roles', 'catalogo', origen] as const,
};
