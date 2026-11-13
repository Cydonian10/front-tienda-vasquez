import { Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

@Component({
  selector: 'app-pagination',
  imports: [LucideChevronLeft, LucideChevronRight],
  template: `
    <nav class="pagination" aria-label="Paginación">
      <span class="count">{{ start() }}–{{ end() }} de {{ total() }} registros</span>
      <div class="pages">
        <button
          type="button"
          aria-label="Página anterior"
          [disabled]="page() <= 1"
          (click)="pageChange.emit(page() - 1)"
        >
          <svg lucideChevronLeft [size]="16" aria-hidden="true"></svg>
        </button>
        @for (item of pages(); track $index) {
          @if (item === '…') {
            <span class="ellipsis" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              [class.current]="item === page()"
              [attr.aria-label]="'Página ' + item"
              [attr.aria-current]="item === page() ? 'page' : null"
              (click)="select(item)"
            >
              {{ item }}
            </button>
          }
        }
        <button
          type="button"
          aria-label="Página siguiente"
          [disabled]="page() >= pageCount()"
          (click)="pageChange.emit(page() + 1)"
        >
          <svg lucideChevronRight [size]="16" aria-hidden="true"></svg>
        </button>
      </div>
    </nav>
  `,
  styles: `
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .count {
      color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
      font-size: 0.76rem;
    }
    .pages {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }
    button,
    .ellipsis {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--color-base-content);
      font: inherit;
      font-size: 0.8rem;
    }
    button {
      cursor: pointer;
    }
    button:hover:not(:disabled),
    button.current {
      background: var(--color-base-300);
    }
    button.current {
      color: var(--color-secondary);
      font-weight: 600;
    }
    button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    button:focus-visible {
      outline: 2px solid var(--color-secondary);
      outline-offset: 2px;
    }
  `,
})
export class Pagination {
  readonly total = input(0);
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly pageChange = output<number>();
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );
  protected readonly start = computed(() =>
    this.total() ? (this.page() - 1) * this.pageSize() + 1 : 0,
  );
  protected readonly end = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  protected readonly pages = computed(() => {
    const last = this.pageCount();
    const visible = new Set([1, last, this.page() - 1, this.page(), this.page() + 1]);
    const numbers = [...visible].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
    const result: (number | string)[] = [];
    numbers.forEach((n, i) => {
      if (i && n - numbers[i - 1] === 2) result.push(n - 1);
      else if (i && n - numbers[i - 1] > 2) result.push('…');
      result.push(n);
    });
    return result;
  });
  protected select(page: number | string): void {
    if (typeof page === 'number') this.pageChange.emit(page);
  }
}
