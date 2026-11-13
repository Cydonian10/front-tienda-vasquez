import { Persona, PersonaDatos } from '@/features/personas/models/persona.model';

export function nuevaPersona(persona?: Persona | null): PersonaDatos {
  return {
    nombres: persona?.nombres ?? '',
    apellidos: persona?.apellidos ?? '',
    tipoDocumento: persona?.tipoDocumento ?? 'DNI',
    numeroDocumento: persona?.numeroDocumento ?? '',
    correo: persona?.correo ?? '',
    telefono: persona?.telefono ?? '',
    fechaNacimiento: persona?.fechaNacimiento ?? '',
    estado: persona?.estado ?? 'Activa',
    direccion: persona?.direccion ?? '',
  };
}
