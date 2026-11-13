export interface PerfilPersona {
  id: string;
  empresaId: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  estado: string;
  direccion: string | null;
  fotoUrl: string | null;
}

export interface Perfil {
  id: string;
  email: string;
  nickname: string;
  persona: PerfilPersona | null;
  roles: { id: string; nombre: string; activo: boolean }[];
  permisos: string[];
}
