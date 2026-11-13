export interface ProductoLista {
  id: string;
  nombre: string;
  marca: string;
  precio: string;
  stock: string;
  unidad: string;
  imagen: string | null;
}
export interface ProductoDetalle {
  id: string;
  nombre: string;
  precio: string;
  stock: string;
  unidades: { unidadId: string; principal: boolean; factor: string }[];
}
export interface Persona {
  id: string;
  nombres: string;
  apellidos: string;
  estado: string;
}
export interface Pagina<T> {
  items: T[];
  total: number;
  totalPages: number;
}
export type Medio = 'efectivo' | 'yape' | 'plin' | 'tarjeta';
export interface VentaDatos {
  operacionId: string;
  modalidad: 'contado' | 'fiado';
  clienteId: string | null;
  vencimiento: string | null;
  detalles: { productoId: string; unidadId: string; cantidad: string }[];
  pago?: { medio: Medio; recibido?: string };
}
export interface VentaRespuesta {
  id: string;
  fecha: string;
  total: string;
  modalidad: string;
}

export interface TicketVenta {
  id: string;
  fecha: string;
  modalidad: 'contado' | 'fiado';
  vencimiento: string | null;
  total: string;
  empresa: { nombre: string; direccion: string | null };
  cliente: string | null;
  detalles: {
    nombre: string;
    unidad: string;
    cantidad: string;
    precioUnitario: string;
    importe: string;
  }[];
  pago: { medio: string; importe: string; recibido: string | null; vuelto: string | null } | null;
}

export interface VentaLista {
  id: string;
  fecha: string;
  modalidad: 'contado' | 'fiado';
  cliente: string | null;
  medio: Medio | null;
  total: string;
}
