import { TestBed } from '@angular/core/testing';
import { PersonaForm } from './persona-form';
import { Persona } from '@/features/personas/models/persona.model';

describe('PersonaForm Signal Forms', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const fixture = TestBed.createComponent(PersonaForm);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    const input = (name: string) => element.querySelector<HTMLInputElement>(`#persona-${name}`)!;
    const setInput = (name: string, value: string) => {
      input(name).value = value;
      input(name).dispatchEvent(new Event('input'));
    };
    const submit = () => {
      element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    };
    const fillRequired = () => {
      setInput('nombres', 'Ana');
      setInput('apellidos', 'Rojas');
      setInput('documento', '12345678');
    };
    return { fixture, element, input, setInput, submit, fillRequired, submitted };
  }

  it('marks required fields as touched without emitting invalid data', () => {
    const { element, input, submit, submitted } = setup();
    expect(input('nombres').getAttribute('aria-invalid')).toBe('false');
    submit();
    for (const name of ['nombres', 'apellidos', 'documento']) {
      expect(input(name).required).toBe(true);
      expect(input(name).getAttribute('aria-invalid')).toBe('true');
      expect(element.querySelector(`#persona-${name}-error`)?.textContent).toContain('obligatorio');
    }
    expect(submitted).not.toHaveBeenCalled();
  });

  it.each([
    ['nombres', '   ', 'solo espacios'],
    ['correo', 'correo-invalido', 'correo electrónico válido'],
    ['nombres', 'A'.repeat(101), '100 caracteres'],
    ['apellidos', 'A'.repeat(101), '100 caracteres'],
    ['documento', '1'.repeat(31), '30 caracteres'],
    ['correo', `${'a'.repeat(250)}@example.com`, '254 caracteres'],
    ['telefono', '1'.repeat(31), '30 caracteres'],
    ['direccion', 'A'.repeat(251), '250 caracteres'],
  ])('validates %s through the schema', (name, value, error) => {
    const { fixture, element, input, setInput, submit, fillRequired, submitted } = setup();
    fillRequired();
    setInput(name, value);
    input(name).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input(name).getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector(`#persona-${name}-error`)?.textContent).toContain(error);
    submit();
    expect(submitted).not.toHaveBeenCalled();
  });

  it('normalizes values, binds selects and emits the optional photo', () => {
    const { element, setInput, submit, fillRequired, submitted } = setup();
    fillRequired();
    setInput('nombres', ' Ana ');
    setInput('apellidos', ' Rojas ');
    setInput('documento', ' 12345678 ');
    for (const [id, value] of [
      ['tipo', 'Pasaporte'],
      ['estado', 'Inactiva'],
    ]) {
      const select = element.querySelector<HTMLSelectElement>(`#persona-${id}`)!;
      select.value = value;
      select.dispatchEvent(new Event('change'));
    }
    const file = new File(['foto'], 'foto.png', { type: 'image/png' });
    const photo = element.querySelector<HTMLInputElement>('#persona-foto')!;
    Object.defineProperty(photo, 'files', { value: { item: () => file } });
    photo.dispatchEvent(new Event('change'));
    submit();
    expect(submitted).toHaveBeenCalledWith({
      datos: expect.objectContaining({
        nombres: 'Ana',
        apellidos: 'Rojas',
        numeroDocumento: '12345678',
        tipoDocumento: 'Pasaporte',
        estado: 'Inactiva',
        correo: '',
      }),
      foto: file,
    });
  });

  it.each([
    new File(['x'], 'bad.txt', { type: 'text/plain' }),
    new File([new Uint8Array(500 * 1024 + 1)], 'large.png', { type: 'image/png' }),
  ])('rejects an invalid or oversized photo', (file) => {
    const { element, fillRequired, submit, submitted } = setup();
    fillRequired();
    const photo = element.querySelector<HTMLInputElement>('#persona-foto')!;
    Object.defineProperty(photo, 'files', { value: { item: () => file } });
    photo.dispatchEvent(new Event('change'));
    submit();
    expect(element.textContent).toContain('La foto debe ser PNG, JPG o WebP');
    expect(submitted).not.toHaveBeenCalled();
  });

  it('blocks submit and cancel while saving and shows the server error without clearing the draft', () => {
    const { fixture, element, input, fillRequired, submit, submitted } = setup();
    fillRequired();
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    expect(element.querySelector<HTMLFieldSetElement>('.fields')?.disabled).toBe(true);
    submit();
    element.querySelector<HTMLButtonElement>('.secondary')!.click();
    expect(submitted).not.toHaveBeenCalled();
    expect(cancelled).not.toHaveBeenCalled();
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('serverError', 'Conflicto al guardar');
    fixture.detectChanges();
    expect(input('nombres').value).toBe('Ana');
    expect(element.textContent).toContain('Conflicto al guardar');
    element.querySelector<HTMLButtonElement>('.secondary')!.click();
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('bloquea el envío sin descartar el borrador ni impedir cancelar', () => {
    const { fixture, element, input, fillRequired, submit, submitted } = setup();
    fillRequired();
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    fixture.componentRef.setInput('allowSubmit', false);
    fixture.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(true);
    submit();
    expect(submitted).not.toHaveBeenCalled();
    expect(input('nombres').value).toBe('Ana');
    element.querySelector<HTMLButtonElement>('.secondary')!.click();
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('initializes once per person, preserves edits on refetch and resets for another ID', () => {
    const { fixture, input, setInput } = setup();
    const persona: Persona = {
      id: '1',
      empresaId: 1,
      nombres: 'Ana',
      apellidos: 'Rojas',
      tipoDocumento: 'DNI',
      numeroDocumento: '123',
      correo: null,
      telefono: null,
      fechaNacimiento: null,
      estado: 'Activa',
      direccion: null,
      fotoUrl: 'foto.png',
    };
    fixture.componentRef.setInput('persona', persona);
    fixture.detectChanges();
    expect(input('nombres').value).toBe('Ana');
    expect(input('correo').value).toBe('');
    setInput('nombres', 'Borrador');
    fixture.componentRef.setInput('persona', { ...persona, nombres: 'Servidor' });
    fixture.detectChanges();
    expect(input('nombres').value).toBe('Borrador');
    fixture.componentRef.setInput('persona', { ...persona, id: '2', nombres: 'Otra' });
    fixture.detectChanges();
    expect(input('nombres').value).toBe('Otra');
  });
});
