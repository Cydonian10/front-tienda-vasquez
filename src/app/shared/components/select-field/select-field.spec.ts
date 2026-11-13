import { TestBed } from '@angular/core/testing';
import { SelectField } from './select-field';

describe('SelectField', () => {
  it('selecciona el valor inicial cuando las opciones llegan después', () => {
    const fixture = TestBed.createComponent(SelectField);
    fixture.componentRef.setInput('inputId', 'marca');
    fixture.componentRef.setInput('label', 'Marca');
    fixture.componentRef.setInput('options', [{ value: '', label: 'Seleccionar' }]);
    fixture.componentRef.setInput('value', 'marca-1');
    fixture.detectChanges();
    fixture.componentRef.setInput('options', [{ value: '', label: 'Seleccionar' }, { value: 'marca-1', label: 'Royal' }]);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('select') as HTMLSelectElement).value).toBe('marca-1');
  });
  it('refleja cambios del valor y permite seleccionar otra opción', () => {
    const fixture = TestBed.createComponent(SelectField);
    fixture.componentRef.setInput('inputId', 'unidad'); fixture.componentRef.setInput('label', 'Unidad');
    fixture.componentRef.setInput('options', [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]);
    fixture.componentRef.setInput('value', 'b'); fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('b'); select.value = 'a'; select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.value()).toBe('a');
  });
});
