import { Component, computed, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-number-field',
  host: { class: 'block' },
  template: `<fieldset class="fieldset">
    <label class="fieldset-legend" [for]="inputId()"
      >{{ label() }}
      @if (required()) {
        <span class="text-secondary" aria-hidden="true">*</span>
      }
    </label>
    <input
      class="input w-full bg-base-300"
      type="number"
      [id]="inputId()"
      [value]="value() ?? ''"
      [attr.min]="min()"
      [attr.step]="step()"
      [required]="required()"
      [disabled]="disabled()"
      [attr.aria-invalid]="showError()"
      [attr.aria-describedby]="showError() && message() ? inputId() + '-error' : null"
      (input)="update($event)"
      (blur)="touch.emit()"
    />
    @if (showError() && message()) {
      <p [id]="inputId() + '-error'" class="text-xs text-error">{{ message() }}</p>
    }
  </fieldset>`,
})
export class NumberField implements FormValueControl<number | null> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly min = input<number | undefined>(undefined);
  readonly step = input<string>('any');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly errors = input<readonly ValidationError[]>([]);
  readonly errorMessage = input('');
  readonly value = model<number | null>(null);
  readonly touch = output<void>();
  protected readonly showError = computed(() => this.touched() && this.invalid());
  protected readonly message = computed(
    () => this.errorMessage() || this.errors()[0]?.message || '',
  );
  protected update(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value === '' ? null : input.valueAsNumber);
  }
}
