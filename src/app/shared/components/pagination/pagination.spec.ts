import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('shows a compact page range and emits a selected page', () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('total', 120);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('page', 6);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('51–60 de 120 registros');
    expect(fixture.nativeElement.textContent).toContain('…');
    const change = vi.fn();
    fixture.componentInstance.pageChange.subscribe(change);
    (fixture.nativeElement.querySelector('[aria-label="Página 7"]') as HTMLButtonElement).click();
    expect(change).toHaveBeenCalledWith(7);
  });
});
