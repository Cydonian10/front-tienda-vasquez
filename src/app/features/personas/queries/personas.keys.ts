export const personasKeys = {
  all: ['personas'] as const,
  detalle: (id: string) => [...personasKeys.all, 'detalle', id] as const,
  listar: (page: number, limit: number, nombre: string) =>
    [...personasKeys.all, { page, limit, nombre }] as const,
};
