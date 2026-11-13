import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { disabled, email, form, FormField, required } from '@angular/forms/signals';
import { TextField } from './text-field';

@Component({
  imports: [ReactiveFormsModule, TextField],
  template: `<app-text-field inputId="test-email" label="Correo" type="email"
    [formControl]="control" [invalid]="control.touched && control.invalid" [touched]="control.touched"
    errorMessage="Correo inválido" [maxLength]="254" />`,
})
class TestHost {
  control = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
}

@Component({
  imports: [FormField, TextField],
  template: `<app-text-field inputId="signal-email" label="Correo" type="email" [formField]="form.email" />`,
})
class SignalTestHost {
  readonly model = signal({ email: '' });
  readonly isDisabled = signal(false);
  readonly form = form(this.model, (path) => {
    required(path.email, { message: 'El correo es obligatorio' });
    email(path.email, { message: 'Correo inválido' });
    disabled(path.email, { when: () => this.isDisabled() });
  });
}

@Component({
  imports: [FormField, TextField],
  template: `<app-text-field inputId="signal-password" label="Contraseña" type="password" [formField]="form.password" />`,
})
class PasswordSignalTestHost {
  readonly model = signal({ password: 'secreto' });
  readonly isDisabled = signal(false);
  readonly form = form(this.model, (path) => {
    disabled(path.password, { when: () => this.isDisabled() });
  });
}

describe('TextField', () => {
  it('sincroniza el formulario, el estado de error y el control deshabilitado', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#test-email')!;
    const error = element.querySelector<HTMLElement>('#test-email-error')!;
    const errorContainer = error.parentElement!;
    expect(errorContainer.style.gridTemplateRows).toBe('0fr');
    expect(errorContainer.getAttribute('aria-hidden')).toBe('true');

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.touched).toBe(true);
    expect(input.getAttribute('aria-describedby')).toBe('test-email-error');
    expect(element.querySelector('#test-email-error')?.textContent).toContain('Correo inválido');
    expect(errorContainer.style.gridTemplateRows).toBe('1fr');
    expect(errorContainer.hasAttribute('aria-hidden')).toBe(false);

    input.value = 'persona@ejemplo.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('persona@ejemplo.com');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(errorContainer.style.gridTemplateRows).toBe('0fr');
    expect(errorContainer.getAttribute('aria-hidden')).toBe('true');

    fixture.componentInstance.control.setValue('otro@ejemplo.com');
    fixture.detectChanges();
    expect(input.value).toBe('otro@ejemplo.com');
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });

  it('funciona con Signal Forms y refleja valor, blur, errores y deshabilitado', async () => {
    const fixture = TestBed.createComponent(SignalTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#signal-email')!;

    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.form.email().touched()).toBe(true);
    expect(input.getAttribute('aria-describedby')).toBe('signal-email-error');
    expect(element.querySelector('#signal-email-error')?.textContent).toContain('El correo es obligatorio');

    input.value = 'persona@ejemplo.com';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.model().email).toBe('persona@ejemplo.com');
    expect(input.hasAttribute('aria-describedby')).toBe(false);

    fixture.componentInstance.model.set({ email: 'otro@ejemplo.com' });
    await fixture.whenStable();
    expect(input.value).toBe('otro@ejemplo.com');
    fixture.componentInstance.isDisabled.set(true);
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });

  it('permite mostrar y ocultar contraseñas con Signal Forms', async () => {
    const fixture = TestBed.createComponent(PasswordSignalTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#signal-password')!;
    const toggle = element.querySelector<HTMLButtonElement>('.password-toggle')!;

    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Mostrar contraseña');
    toggle.click();
    await fixture.whenStable();
    expect(input.type).toBe('text');
    expect(input.value).toBe('secreto');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    toggle.click();
    await fixture.whenStable();
    expect(input.type).toBe('password');
    fixture.componentInstance.isDisabled.set(true);
    await fixture.whenStable();
    expect(toggle.disabled).toBe(true);
  });
});
