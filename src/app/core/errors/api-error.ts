import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return 'No pudimos conectar con el servidor. Comprobá tu conexión y que la API esté encendida.';
    if (error.status === 403) return 'Tu cuenta no tiene permiso para realizar esta operación.';
    if (error.status === 429) return 'Demasiados intentos. Esperá un momento y volvé a intentar.';
    if (error.status >= 500)
      return 'El servidor no está disponible en este momento. Intentá nuevamente más tarde.';
  }
  return fallback;
}
