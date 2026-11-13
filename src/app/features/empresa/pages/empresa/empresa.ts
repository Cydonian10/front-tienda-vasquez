import { Component, effect, inject, signal, untracked } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { LucideBuilding2, LucideFileText, LucideMapPin } from '@lucide/angular';
import { apiErrorMessage } from '@/core/errors/api-error';
import { Empresa, EmpresaDatos } from '@/features/empresa/models/empresa.model';
import { EmpresaQueries } from '@/features/empresa/queries/empresa.queries';
import { EmpresaMutations } from '@/features/empresa/queries/empresa.mutations';
import { TextField } from '@/shared/components/text-field/text-field';
import { SelectField } from '@/shared/components/select-field/select-field';
import { FileField } from '@/shared/components/file-field/file-field';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';

const emptyForm = (): EmpresaDatos => ({
  razonSocial: '',
  nombreComercial: '',
  actividad: '',
  tipoDocumento: 'RUC',
  numeroDocumento: '',
  tipoEmpresa: '',
  direccion: '',
  telefono: '',
  correo: '',
});

@Component({
  selector: 'app-empresa-page',
  imports: [LucideBuilding2, LucideFileText, LucideMapPin, TextField, SelectField, FileField],
  templateUrl: './empresa.html',
  styleUrl: './empresa.css',
})
export class EmpresaPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(EmpresaQueries);
  private readonly mutations = inject(EmpresaMutations);
  private initialized = false;
  protected form = emptyForm();
  protected logo: File | null = null;
  protected readonly editing = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly fileError = signal('');
  protected readonly company = injectQuery(() => this.queries.obtener());
  protected readonly saveMutation = injectMutation(() => this.mutations.guardar());
  protected readonly documentTypes = [
    { value: 'RUC', label: 'RUC' },
    { value: 'DNI', label: 'DNI' },
    { value: 'otro', label: 'Otro' },
  ];
  protected readonly companyTypes = [
    { value: '', label: 'Selecciona una opción' },
    ...['S.A.C.', 'S.A.', 'S.R.L.', 'E.I.R.L.', 'Persona natural', 'Otro'].map((label) => ({
      value: label,
      label,
    })),
  ];

  constructor() {
    effect(() => {
      const company = this.company.data();
      if (company === undefined) return;
      if (this.initialized && untracked(this.editing)) return;
      this.resetForm(company);
      this.editing.set(
        company === null && untracked(() => this.access.puede(PERMISOS.EMPRESA.EDITAR)),
      );
      this.initialized = true;
    });
    effect(() => {
      if (!this.access.puede(PERMISOS.EMPRESA.EDITAR)) this.editing.set(false);
    });
  }

  protected startEditing(): void {
    if (!this.access.puede(PERMISOS.EMPRESA.EDITAR)) return;
    this.message.set('');
    this.error.set('');
    this.fileError.set('');
    this.editing.set(true);
  }

  protected cancel(): void {
    this.resetForm(this.company.data() ?? null);
    this.error.set('');
    this.fileError.set('');
    this.editing.set(false);
  }

  protected selectLogo(file: File | null): void {
    this.logo = null;
    this.fileError.set('');
    if (
      file &&
      (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 500 * 1024)
    ) {
      this.fileError.set('El logo debe ser PNG, JPG o WebP y pesar como máximo 500 KB.');
      return;
    }
    this.logo = file;
  }

  protected save(): void {
    this.message.set('');
    this.error.set('');
    if (
      !this.access.puede(PERMISOS.EMPRESA.EDITAR) ||
      this.fileError() ||
      this.saveMutation.isPending()
    )
      return;
    this.saveMutation.mutate(
      { datos: { ...this.form }, logo: this.logo },
      {
        onSuccess: (company) => {
          this.resetForm(company);
          this.editing.set(false);
          this.message.set('Información guardada correctamente.');
        },
        onError: (error) =>
          this.error.set(
            apiErrorMessage(
              error,
              'No se pudo guardar la información. Revisa los datos e inténtalo nuevamente.',
            ),
          ),
      },
    );
  }

  private resetForm(company: Empresa | null): void {
    const defaults = emptyForm();
    this.form = Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [
        key,
        company?.[key as keyof EmpresaDatos] ?? value,
      ]),
    ) as unknown as EmpresaDatos;
    this.logo = null;
  }
}
