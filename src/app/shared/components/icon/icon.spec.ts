import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';

describe('Icon', () => {
  it('oculta íconos decorativos y permite una etiqueta accesible', () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'google');
    fixture.componentRef.setInput('size', 18);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('width')).toBe('18');
    fixture.componentRef.setInput('label', 'Sol');
    fixture.detectChanges();
    expect(svg.getAttribute('aria-label')).toBe('Sol');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
  });
});
