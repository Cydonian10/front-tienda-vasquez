import { Component, input, output } from '@angular/core';
import { LucideImage } from '@lucide/angular';

@Component({
  selector: 'app-file-field',
  imports: [LucideImage],
  host: { class: 'block min-w-0' },
  template: `
    <fieldset class="fieldset">
      <label class="fieldset-legend" [for]="inputId()">{{ label() }} @if (required()) { <span class="text-secondary" aria-hidden="true">*</span> }</label>
      <div class="flex min-w-0 items-center gap-3 rounded-xl border border-dashed border-base-content/20 bg-base-100/50 p-4">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-secondary"><svg lucideImage [size]="20" aria-hidden="true"></svg></span>
        <div class="min-w-0">
          <input class="file-input file-input-sm max-w-full bg-base-300" type="file" [id]="inputId()" [attr.name]="name()"
            [attr.accept]="accept()" [required]="required()" [disabled]="disabled()"
            [attr.aria-describedby]="help() ? inputId() + '-help' : null" (change)="onChange($event)" (blur)="touch.emit()" />
          @if (help()) { <p class="mt-1 text-xs text-base-content/60" [id]="inputId() + '-help'">{{ help() }}</p> }
        </div>
      </div>
    </fieldset>
  `,
})
export class FileField {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly name = input<string | null>(null);
  readonly accept = input<string | null>(null);
  readonly help = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly fileChange = output<File | null>();
  readonly touch = output<void>();
  protected onChange(event: Event): void { this.fileChange.emit((event.target as HTMLInputElement).files?.item(0) ?? null); }
}
