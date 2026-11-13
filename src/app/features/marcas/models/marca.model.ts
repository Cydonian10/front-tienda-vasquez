export interface MarcaDatos {
  nombre: string;
  descripcion: string | null;
}
export interface Marca extends MarcaDatos {
  id: string;
}
export interface PaginaMarcas {
  items: Marca[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
