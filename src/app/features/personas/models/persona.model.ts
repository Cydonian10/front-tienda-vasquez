export interface PersonaDatos {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  estado: string;
  direccion: string;
}

export interface Persona extends Omit<
  PersonaDatos,
  'correo' | 'telefono' | 'fechaNacimiento' | 'direccion'
> {
  id: string;
  empresaId: number;
  correo: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  direccion: string | null;
  fotoUrl: string | null;
}

export interface PaginaPersonas {
  items: Persona[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
