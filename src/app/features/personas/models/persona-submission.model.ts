import { PersonaDatos } from './persona.model';

export interface PersonaSubmission {
  datos: PersonaDatos;
  foto: File | null;
}
