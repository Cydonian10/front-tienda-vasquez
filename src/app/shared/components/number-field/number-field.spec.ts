import { TestBed } from '@angular/core/testing';
import { NumberField } from './number-field';

describe('NumberField', () => {
  it('emite números y representa un campo vacío como null', () => {
    const fixture = TestBed.createComponent(NumberField);
    fixture.componentRef.setInput('inputId', 'precio');
    fixture.componentRef.setInput('label', 'Precio');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '12.5'; input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.value()).toBe(12.5);
    input.value = ''; input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.value()).toBeNull();
  });
});
