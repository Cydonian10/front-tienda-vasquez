import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PersonaPageLayout } from './persona-page-layout';

@Component({
  imports: [PersonaPageLayout],
  template: `
    <app-persona-page-layout
      title="Nueva persona"
      subtitle="Completa los datos"
      cardLabel="Registro de persona"
      [backDisabled]="disabled()"
      (back)="back()"
    >
      <p>Contenido proyectado</p>
    </app-persona-page-layout>
  `,
})
class TestHost {
  readonly disabled = signal(false);
  readonly back = vi.fn();
}

describe('PersonaPageLayout', () => {
  it('renders its inputs and projected content, and emits back only when enabled', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toBe('Nueva persona');
    expect(element.textContent).toContain('Completa los datos');
    expect(element.querySelector('section')?.getAttribute('aria-label')).toBe('Registro de persona');
    expect(element.querySelector('section')?.textContent).toContain('Contenido proyectado');

    const button = element.querySelector<HTMLButtonElement>('.back-link')!;
    button.click();
    expect(fixture.componentInstance.back).toHaveBeenCalledTimes(1);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.back).toHaveBeenCalledTimes(1);
  });
});
