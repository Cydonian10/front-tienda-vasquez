export const unidadesMedidaKeys = {
  all: ['unidades-medida'] as const,
  lists: ['unidades-medida', 'lista'] as const,
  list: (page: number, limit: number, nombre: string) =>
    ['unidades-medida', 'lista', page, limit, nombre] as const,
  detail: (id: string) => ['unidades-medida', 'detalle', id] as const,
};
