import { Component, computed, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-textarea-field',
  host: { class: 'block' },
  template: `
    <fieldset class="fieldset">
      <label class="fieldset-legend" [for]="inputId()"
        >{{ label() }}
        @if (required()) {
          <span class="text-secondary" aria-hidden="true">*</span>
        }
      </label>
      <textarea
        class="textarea w-full bg-base-300"
        [id]="inputId()"
        [attr.name]="name()"
        [value]="value()"
        [placeholder]="placeholder()"
        [rows]="rows()"
        [attr.maxlength]="maxLength()"
        [required]="required()"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-invalid]="showError()"
        [attr.aria-describedby]="showError() && displayError() ? inputId() + '-error' : null"
        (input)="updateValue($event)"
        (blur)="touch.emit()"
      ></textarea>
      @if (showError() && displayError()) {
        <p [id]="inputId() + '-error'" class="text-xs text-error">{{ displayError() }}</p>
      }
    </fieldset>
  `,
})
export class TextareaField implements FormValueControl<string> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly name = input('');
  readonly placeholder = input('');
  readonly rows = input(3);
  readonly maxLength = input<number | undefined>(undefined);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readOnly = input(false);
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
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
}
