import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
  selector: 'app-text-field',
  imports: [LucideEye, LucideEyeOff],
  host: { class: 'block' },
  template: `
    <fieldset class="fieldset">
      <label class="fieldset-legend" [for]="inputId()">{{ label() }} @if (required()) { <span class="text-secondary" aria-hidden="true">*</span> }</label>
      <div class="relative">
        <input
          [id]="inputId()"
          [attr.name]="name()"
          [attr.inputmode]="inputMode()"
          [required]="required()"
          class="input w-full bg-base-300"
          [type]="type() === 'password' && showPassword() ? 'text' : type()"
          [class.pr-12]="type() === 'password'"
          [value]="value()"
          [attr.autocomplete]="autocomplete()"
          [placeholder]="placeholder()"
          [attr.maxlength]="maxLength()"
          [readOnly]="readOnly() || readonly()"
          [disabled]="disabled()"
          [attr.aria-invalid]="showError()"
          [attr.aria-describedby]="showError() && displayError() ? inputId() + '-error' : null"
          (input)="updateValue($event)"
          (blur)="touch.emit()"
        />
        @if (type() === 'password') {
          <button
            class="password-toggle btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2"
            type="button"
            [disabled]="disabled()"
            (click)="togglePassword()"
            [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            [attr.aria-pressed]="showPassword()"
            [attr.aria-controls]="inputId()"
          >
            @if (showPassword()) {
              <svg lucideEyeOff [size]="20" [strokeWidth]="1.6" aria-hidden="true"></svg>
            } @else {
              <svg lucideEye [size]="20" [strokeWidth]="1.6" aria-hidden="true"></svg>
            }
          </button>
        }
      </div>
      <div
        class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
        [style.grid-template-rows]="showError() && displayError() ? '1fr' : '0fr'"
        [attr.aria-hidden]="showError() && displayError() ? null : 'true'"
      >
        <p
          [id]="inputId() + '-error'"
          class="min-h-0 overflow-hidden wrap-break-word text-xs leading-4 text-error"
        >
          {{ displayError() }}
        </p>
      </div>
    </fieldset>
  `,
})
export class TextField implements FormValueControl<string> {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly name = input('');
  readonly inputMode = input<string | null>(null);
  readonly required = input(false);
  readonly type = input('text');
  readonly autocomplete = input<string | null>(null);
  readonly placeholder = input('');
  readonly maxLength = input<number | undefined>(undefined);
  readonly readOnly = input(false);
  readonly readonly = input(false);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly errors = input<readonly ValidationError[]>([]);
  readonly errorMessage = input('');
  readonly value = model('');
  readonly touch = output<void>();
  protected readonly showPassword = signal(false);
  protected readonly showError = computed(() => this.touched() && this.invalid());
  protected readonly displayError = computed(
    () => this.errorMessage() || this.errors()[0]?.message || '',
  );

  protected updateValue(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }
}
