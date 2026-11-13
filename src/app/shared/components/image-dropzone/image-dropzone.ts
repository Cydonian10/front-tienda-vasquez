import { Component, input, output, signal } from '@angular/core';
import { LucideImage } from '@lucide/angular';

@Component({
  selector: 'app-image-dropzone',
  imports: [LucideImage],
  host: { class: 'block' },
  template: ` <div
    class="rounded-xl border border-dashed bg-base-100/50 p-5 text-center transition-colors"
    [class.border-secondary]="dragging()"
    [class.bg-primary/10]="dragging()"
    [class.border-base-content/20]="!dragging()"
    (dragover)="dragOver($event)"
    (dragleave)="dragLeave($event)"
    (drop)="drop($event)"
  >
    <span class="mx-auto grid size-10 place-items-center rounded-xl bg-primary/15 text-secondary"
      ><svg lucideImage [size]="20" aria-hidden="true"></svg
    ></span>
    <p class="mt-3 text-sm font-medium">Arrastra tus imágenes aquí</p>
    <p class="mt-1 text-xs text-base-content/60">{{ help() }}</p>
    <label
      [for]="inputId()"
      class="btn btn-outline btn-sm mt-4 cursor-pointer focus-within:outline-2 focus-within:outline-secondary"
    >
      Seleccionar imágenes
      <input
        [id]="inputId()"
        class="sr-only"
        type="file"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="disabled()"
        (change)="select($event)"
      />
    </label>
  </div>`,
})
export class ImageDropzone {
  readonly inputId = input.required<string>();
  readonly accept = input('image/png,image/jpeg,image/webp');
  readonly help = input('');
  readonly multiple = input(true);
  readonly disabled = input(false);
  readonly filesChange = output<File[]>();
  protected readonly dragging = signal(false);
  protected dragOver(event: DragEvent) {
    event.preventDefault();
    if (!this.disabled()) this.dragging.set(true);
  }
  protected dragLeave(event: DragEvent) {
    if (
      !event.currentTarget ||
      !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)
    )
      this.dragging.set(false);
  }
  protected drop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    if (!this.disabled()) this.filesChange.emit(Array.from(event.dataTransfer?.files ?? []));
  }
  protected select(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.filesChange.emit(files);
  }
}
