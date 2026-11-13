/** Claves existentes de caché utilizadas por el punto de venta. */
export const ventasKeys = {
  listas: ['ventas', 'lista'] as const,
  lista: (inicio: string, fin: string, page: number) => ['ventas', 'lista', inicio, fin, page] as const,
  productos: ['ventas', 'productos'] as const,
  productosLista: (page: number, nombre: string, categoriaId: string) =>
    ['ventas', 'productos', page, nombre, categoriaId] as const,
  producto: ['ventas', 'producto'] as const,
  productoDetalle: (id: string) => ['ventas', 'producto', id] as const,
  categorias: ['categorias', 'ventas'] as const,
  personas: (nombre: string, page: number) => ['ventas', 'personas', nombre, page] as const,
  unidades: ['ventas', 'unidades'] as const,
};
