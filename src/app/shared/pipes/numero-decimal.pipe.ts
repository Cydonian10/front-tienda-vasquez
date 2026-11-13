import { Pipe, PipeTransform } from '@angular/core';

/** Formatea cantidades para mostrarlas con dos decimales. */
@Pipe({ name: 'numeroDecimal' })
export class NumeroDecimalPipe implements PipeTransform {
  private readonly formato = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(valor: number | string | null | undefined): string {
    if (valor == null || (typeof valor === 'string' && !valor.trim())) return '—';
    const numero = Number(valor);
    return Number.isFinite(numero) ? this.formato.format(numero) : '—';
  }
}
