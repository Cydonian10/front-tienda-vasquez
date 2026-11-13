export const marcasKeys = {
  all: ['marcas'] as const,
  lists: ['marcas', 'lista'] as const,
  list: (page: number, limit: number, nombre: string) =>
    ['marcas', 'lista', page, limit, nombre] as const,
  detail: (id: string) => ['marcas', 'detalle', id] as const,
};
