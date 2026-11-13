import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from '@/core/errors/api-error';

export function personaSaveError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 409) {
    return error.error?.message === 'Primero registra la empresa'
      ? 'Primero registra la empresa para poder agregar personas.'
      : 'Ya existe una persona con ese documento.';
  }
  if (error instanceof HttpErrorResponse && error.status === 413) {
    return 'La foto supera el tamaño permitido de 500 KB.';
  }
  return apiErrorMessage(
    error,
    'No se pudo guardar la persona. Revisa los datos e inténtalo de nuevo.',
  );
}
