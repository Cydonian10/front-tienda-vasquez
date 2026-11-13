import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { map } from 'rxjs';
import { apiErrorMessage } from '@/core/errors/api-error';
import { PersonaForm } from '@/features/personas/components/persona-form/persona-form';
import { PersonaPageLayout } from '@/features/personas/components/persona-page-layout/persona-page-layout';
import { PersonaSubmission } from '@/features/personas/models/persona-submission.model';
import { PersonasQueries } from '@/features/personas/queries/personas.queries';
import { PersonasMutations } from '@/features/personas/queries/personas.mutations';
import { personaSaveError } from '@/features/personas/errors/persona-save-error';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';

@Component({
  selector: 'app-persona-edit',
  imports: [PersonaForm, PersonaPageLayout],
  templateUrl: './persona-edit.html',
  styleUrl: './persona-edit.css',
})
export class PersonaEditPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly queries = inject(PersonasQueries);
  private readonly mutations = inject(PersonasMutations);
  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    {
      initialValue: this.route.snapshot.paramMap.get('id') ?? '',
    },
  );
  protected readonly persona = injectQuery(() => this.queries.obtener(this.id()));
  protected readonly mutation = injectMutation(() => this.mutations.actualizar());
  protected readonly error = signal('');
  protected readonly notFound = computed(() => {
    const error = this.persona.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly loadError = computed(() =>
    apiErrorMessage(this.persona.error(), 'No se pudo cargar la persona.'),
  );

  protected save(submission: PersonaSubmission): void {
    if (
      this.mutation.isPending() ||
      !this.persona.data() ||
      !this.access.puede(PERMISOS.PERSONAS.LEER) ||
      !this.access.puede(PERMISOS.PERSONAS.EDITAR)
    )
      return;
    this.error.set('');
    this.mutation.mutate(
      { ...submission, id: this.id() },
      {
        onSuccess: () => this.back('Persona actualizada correctamente.'),
        onError: (error) => this.error.set(personaSaveError(error)),
      },
    );
  }

  protected back(message = ''): void {
    const target = this.access.puede(PERMISOS.PERSONAS.LEER) ? '/admin/personas' : '/admin';
    void this.router.navigate([target], { state: { personaMessage: message } });
  }
}
