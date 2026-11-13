import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-dialog-shell',
  imports: [LucideX],
  template: `
    <div class="dialog-shell" [style.width]="width()">
      <header>
        <div>
          @if (eyebrow()) {
            <p class="eyebrow">{{ eyebrow() }}</p>
          }
          <h2 [id]="titleId()">{{ title() }}</h2>
          @if (description()) {
            <p class="description">{{ description() }}</p>
          }
        </div>
        <button
          type="button"
          class="close"
          aria-label="Cerrar diálogo"
          [disabled]="closeDisabled()"
          (click)="closed.emit()"
        >
          <svg lucideX [size]="18" aria-hidden="true"></svg>
        </button>
      </header>
      <ng-content />
    </div>
  `,
  styles: `
    .dialog-shell {
      width: min(620px, calc(100vw - 2rem));
      max-height: calc(100dvh - 2rem);
      overflow: auto;
      border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
      border-radius: 20px;
      background: var(--color-base-200);
      color: var(--color-base-content);
      box-shadow: 0 24px 80px rgb(0 0 0 / 0.35);
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.6rem 1.75rem 1.35rem;
      border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 9%, transparent);
    }
    h2,
    p {
      margin: 0;
    }
    h2 {
      font-size: 1.3rem;
      font-weight: 500;
      letter-spacing: -0.02em;
    }
    .eyebrow {
      color: var(--color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      font-size: 0.65rem;
      margin-bottom: 0.5rem;
    }
    .description {
      color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
      font-size: 0.8rem;
      margin-top: 0.35rem;
    }
    .close {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 10px;
      background: var(--color-base-300);
      color: var(--color-base-content);
      cursor: pointer;
    }
    .close:focus-visible {
      outline: 2px solid var(--color-secondary);
      outline-offset: 2px;
    }
    @media (max-width: 600px) {
      header {
        padding: 1.3rem;
      }
    }
  `,
})
export class DialogShell {
  readonly width = input('min(620px, calc(100vw - 2rem))');
  readonly title = input.required<string>();
  readonly titleId = input.required<string>();
  readonly eyebrow = input('Administración');
  readonly description = input('');
  readonly closeDisabled = input(false);
  readonly closed = output<void>();
}
