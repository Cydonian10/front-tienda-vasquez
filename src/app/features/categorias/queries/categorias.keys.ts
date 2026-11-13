export const categoriasKeys = {
  all: ['categorias'] as const,
  lists: ['categorias', 'lista'] as const,
  list: (page: number, limit: number, nombre: string) =>
    ['categorias', 'lista', page, limit, nombre] as const,
  detail: (id: string) => ['categorias', 'detalle', id] as const,
};
