import { Component, computed, effect, input, output, signal } from '@angular/core';
import { email, form, FormField, maxLength, pattern, required } from '@angular/forms/signals';
import { TextField } from '@/shared/components/text-field/text-field';
import { SelectField } from '@/shared/components/select-field/select-field';
import { FileField } from '@/shared/components/file-field/file-field';
import { Persona } from '@/features/personas/models/persona.model';
import { PersonaSubmission } from '@/features/personas/models/persona-submission.model';
import { nuevaPersona } from './persona-form.defaults';

@Component({
  selector: 'app-persona-form',
  imports: [FormField, TextField, SelectField, FileField],
  templateUrl: './persona-form.html',
  styleUrl: './persona-form.css',
})
export class PersonaForm {
  readonly persona = input<Persona | null>(null);
  readonly saving = input(false);
  readonly allowSubmit = input(true);
  readonly serverError = input('');
  readonly submitted = output<PersonaSubmission>();
  readonly cancelled = output<void>();
  private initializedFor: string | null | undefined;
  protected readonly editing = computed(() => !!this.persona());
  protected readonly personaModel = signal(nuevaPersona());
  protected readonly personaForm = form(this.personaModel, (path) => {
    for (const field of [path.nombres, path.apellidos, path.numeroDocumento]) {
      required(field, { message: 'Este campo es obligatorio.' });
      pattern(field, /\S/, { message: 'Este campo no puede contener solo espacios.' });
    }
    required(path.tipoDocumento, { message: 'Selecciona el tipo de documento.' });
    maxLength(path.nombres, 100, { message: 'Los nombres no pueden superar los 100 caracteres.' });
    maxLength(path.apellidos, 100, {
      message: 'Los apellidos no pueden superar los 100 caracteres.',
    });
    maxLength(path.numeroDocumento, 30, {
      message: 'El documento no puede superar los 30 caracteres.',
    });
    maxLength(path.correo, 254, { message: 'El correo no puede superar los 254 caracteres.' });
    email(path.correo, { message: 'Ingresa un correo electrónico válido.' });
    maxLength(path.telefono, 30, { message: 'El teléfono no puede superar los 30 caracteres.' });
    maxLength(path.direccion, 250, {
      message: 'La dirección no puede superar los 250 caracteres.',
    });
  });
  protected foto: File | null = null;
  protected readonly fotoUrl = computed(() => this.persona()?.fotoUrl);
  protected readonly fileError = signal('');
  protected readonly formError = signal('');
  protected readonly documentTypes = ['DNI', 'Carné de extranjería', 'Pasaporte', 'Otro'].map(
    (value) => ({ value, label: value }),
  );
  protected readonly states = ['Activa', 'Inactiva'].map((value) => ({ value, label: value }));

  constructor() {
    effect(() => {
      const persona = this.persona();
      const id = persona?.id ?? null;
      if (this.initializedFor === id) return;
      this.initializedFor = id;
      this.personaForm().reset(nuevaPersona(persona));
      this.foto = null;
      this.fileError.set('');
      this.formError.set('');
    });
  }

  protected close(): void {
    if (!this.saving()) this.cancelled.emit();
  }
  protected selectPhoto(file: File | null): void {
    this.fileError.set('');
    this.foto = null;
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 500 * 1024) {
      this.fileError.set('La foto debe ser PNG, JPG o WebP y pesar como máximo 500 KB.');
      return;
    }
    this.foto = file;
  }
  protected save(): void {
    this.formError.set('');
    if (this.fileError() || this.saving() || !this.allowSubmit()) return;
    this.personaModel.update((datos) => ({
      ...datos,
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      numeroDocumento: datos.numeroDocumento.trim(),
      correo: datos.correo.trim(),
    }));
    this.personaForm().markAsTouched();
    if (this.personaForm().invalid()) {
      this.formError.set('Revisa los campos del formulario antes de guardar.');
      return;
    }
    this.submitted.emit({ datos: { ...this.personaModel() }, foto: this.foto });
  }
}
