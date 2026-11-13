export interface CategoriaDatos {
  nombre: string;
  descripcion: string | null;
}
export interface Categoria extends CategoriaDatos {
  id: string;
}
export interface PaginaCategorias {
  items: Categoria[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
