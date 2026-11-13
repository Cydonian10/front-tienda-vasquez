import { Component, input } from '@angular/core';

/** A responsive surface for semantic tables supplied by the caller. */
@Component({
  selector: 'app-data-table',
  template: `<div class="table-scroll" tabindex="0" [attr.aria-label]="label()">
    <ng-content />
  </div>`,
  styles: `
    :host {
      display: block;
    }
    .table-scroll {
      overflow-x: auto;
      overscroll-behavior-x: contain;
    }
    .table-scroll:focus-visible {
      outline: 2px solid var(--color-secondary);
      outline-offset: -2px;
    }
  `,
})
export class DataTable {
  readonly label = input('Tabla de datos');
}
