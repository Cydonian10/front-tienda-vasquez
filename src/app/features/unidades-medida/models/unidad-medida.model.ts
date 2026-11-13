export interface UnidadMedidaDatos {
  nombre: string;
  abreviatura: string;
}
export interface UnidadMedida extends UnidadMedidaDatos {
  id: string;
}
export interface PaginaUnidadesMedida {
  items: UnidadMedida[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
