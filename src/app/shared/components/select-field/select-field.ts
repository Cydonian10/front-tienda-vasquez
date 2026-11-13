import { Component, computed, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  host: { class: 'block' },
  template: `
    <fieldset class="fieldset">
      <label class="fieldset-legend" [for]="inputId()"
        >{{ label() }}
        @if (required()) {
          <span class="text-secondary" aria-hidden="true">*</span>
        }
      </label>
      <select
        class="select w-full bg-base-300"
        [id]="inputId()"
        [attr.name]="name()"
        [value]="value()"
        [required]="required()"
        [disabled]="disabled()"
        [attr.aria-invalid]="showError()"
        [attr.aria-describedby]="showError() && displayError() ? inputId() + '-error' : null"
        (change)="updateValue($event)"
        (blur)="touch.emit()"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">
            {{ option.label }}
          </option>
        }
      </select>
      @if (showError() && displayError()) {
        <p [id]="inputId() + '-error'" class="text-xs text-error">{{ displayError() }}</p>
      }
    </fieldset>
  `,
})
export class SelectField implements FormValueControl<string> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly name = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly errors = input<readonly ValidationError[]>([]);
  readonly errorMessage = input('');
  readonly value = model('');
  readonly touch = output<void>();
  protected readonly showError = computed(() => this.touched() && this.invalid());
  protected readonly displayError = computed(
    () => this.errorMessage() || this.errors()[0]?.message || '',
  );
  protected updateValue(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
