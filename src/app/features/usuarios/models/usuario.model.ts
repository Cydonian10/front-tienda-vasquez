export interface PersonaResumen {
  id: string;
  nombres: string;
  apellidos: string;
  fotoUrl: string | null;
}

export interface PersonaDetalle extends PersonaResumen {
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  estado: string;
  direccion: string | null;
}

export interface Usuario {
  id: string;
  email: string;
  nickname: string;
  personaId: string | null;
  persona: PersonaResumen | null;
}

export interface UsuarioDatos {
  email: string;
  nickname: string;
  personaId: string | null;
}

export interface NuevoUsuario extends UsuarioDatos {
  password: string;
}

export interface RolUsuario {
  id: string;
  nombre: string;
  activo: boolean;
  sistema: boolean;
  permisos: { id: string; codigo: string; nombre: string }[];
}

export interface PaginaPersonas {
  items: PersonaResumen[];
  page: number;
  totalPages: number;
  total: number;
}
