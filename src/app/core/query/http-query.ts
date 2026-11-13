import { firstValueFrom, fromEvent, Observable, takeUntil } from 'rxjs';

/** Cancela también HttpClient cuando TanStack cancela la consulta. */
export function httpQuery<T>(request: Observable<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new DOMException('Consulta cancelada', 'AbortError'));
  return firstValueFrom(request.pipe(takeUntil(fromEvent(signal, 'abort'))));
}
