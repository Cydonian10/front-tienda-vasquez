export interface Producto {
  id: string;
  nombre: string;
  precio: string;
  stock: string;
  stockMinimo: string;
  sku: string | null;
  codigoBarras: string | null;
  marca: string;
  unidad: string;
  imagen: string | null;
}
export interface PaginaProductos {
  items: Producto[];
  page: number;
  totalPages: number;
  total: number;
}

export interface ProductoDetalle {
  id: string;
  nombre: string;
  marcaId: string;
  precio: string;
  stock: string;
  stockMinimo: string;
  sku: string | null;
  codigoBarras: string | null;
  categoriaIds: string[];
  unidades: { unidadId: string; principal: boolean; factor: string }[];
  imagenes: { id: string; url: string }[];
}
