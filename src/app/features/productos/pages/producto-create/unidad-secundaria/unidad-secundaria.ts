import { Component, input, model, output } from '@angular/core';
import { SelectField, SelectOption } from '@/shared/components/select-field/select-field';
import { NumberField } from '@/shared/components/number-field/number-field';

@Component({
  selector: 'app-unidad-secundaria',
  imports: [SelectField, NumberField],
  template: `<div class="mt-4 flex flex-wrap items-end gap-3">
    <app-select-field
      class="min-w-40 flex-1"
      [inputId]="'unidad-secundaria-' + index()"
      label="Unidad"
      [options]="options()"
      [(value)]="unidadId"
    /><app-number-field
      class="min-w-32 flex-1"
      [inputId]="'factor-secundario-' + index()"
      label="Factor de conversión"
      [min]="0.000001"
      [(value)]="factor"
    /><button
      class="btn btn-ghost text-error"
      type="button"
      (click)="quitar.emit()"
      [attr.aria-label]="'Quitar unidad ' + (index() + 1)"
    >
      Quitar
    </button>
  </div>`,
})
export class UnidadSecundaria {
  readonly index = input.required<number>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly unidadId = model('');
  readonly factor = model<number | null>(null);
  readonly quitar = output<void>();
}
