import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { SelectField } from '@/shared/components/select-field/select-field';
import { TextareaField } from '@/shared/components/textarea-field/textarea-field';
import { FileField } from '@/shared/components/file-field/file-field';
import { TextField } from '@/shared/components/text-field/text-field';

@Component({
  imports: [FormField, SelectField, TextareaField, FileField, TextField],
  template: `
    <app-text-field
      inputId="text"
      name="text"
      label="Texto"
      inputMode="numeric"
      [required]="true"
    />
    <app-select-field
      inputId="select"
      label="Selección"
      [options]="options"
      [formField]="fields.choice"
    />
    <app-textarea-field inputId="area" label="Descripción" [formField]="fields.description" />
    <app-file-field
      inputId="file"
      label="Archivo"
      help="Solo imágenes"
      (fileChange)="file = $event"
    />
  `,
})
class Host {
  readonly options = [
    { value: '', label: 'Elige' },
    { value: 'a', label: 'A' },
  ];
  readonly model = signal({ choice: '', description: '' });
  readonly fields = form(this.model, (path) => {
    required(path.choice, { message: 'Obligatorio' });
  });
  file: File | null = null;
}

describe('Campos compartidos', () => {
  it('conserva atributos y sincroniza select y textarea con Signal Forms', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.querySelector<HTMLInputElement>('#text')!;
    expect(text.required).toBe(true);
    expect(text.name).toBe('text');
    expect(text.getAttribute('inputmode')).toBe('numeric');
    const select = root.querySelector<HTMLSelectElement>('#select')!;
    select.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(select.getAttribute('aria-describedby')).toBe('select-error');
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    const area = root.querySelector<HTMLTextAreaElement>('#area')!;
    area.value = 'Una descripción';
    area.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.model()).toEqual({
      choice: 'a',
      description: 'Una descripción',
    });
    expect(select.hasAttribute('aria-describedby')).toBe(false);
  });

  it('emite el archivo seleccionado y vincula el texto de ayuda', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#file')!;
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: { item: () => file } });
    input.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.file).toBe(file);
    expect(input.getAttribute('aria-describedby')).toBe('file-help');
  });
});
