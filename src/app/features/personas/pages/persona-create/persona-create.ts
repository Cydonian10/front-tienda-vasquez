import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { PersonaForm } from '@/features/personas/components/persona-form/persona-form';
import { PersonaPageLayout } from '@/features/personas/components/persona-page-layout/persona-page-layout';
import { PersonaSubmission } from '@/features/personas/models/persona-submission.model';
import { PersonasMutations } from '@/features/personas/queries/personas.mutations';
import { personaSaveError } from '@/features/personas/errors/persona-save-error';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';

@Component({
  selector: 'app-persona-create',
  imports: [PersonaForm, PersonaPageLayout],
  templateUrl: './persona-create.html',
})
export class PersonaCreatePage {
  private readonly router = inject(Router);
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly mutations = inject(PersonasMutations);
  protected readonly mutation = injectMutation(() => this.mutations.crear());
  protected readonly error = signal('');

  protected save(submission: PersonaSubmission): void {
    if (this.mutation.isPending() || !this.access.puede(PERMISOS.PERSONAS.CREAR)) return;
    this.error.set('');
    this.mutation.mutate(submission, {
      onSuccess: () => this.back('Persona registrada correctamente.'),
      onError: (error) => this.error.set(personaSaveError(error)),
    });
  }

  protected back(message = ''): void {
    const target = this.access.puede(PERMISOS.PERSONAS.LEER) ? '/admin/personas' : '/admin';
    void this.router.navigate([target], { state: { personaMessage: message } });
  }
}
