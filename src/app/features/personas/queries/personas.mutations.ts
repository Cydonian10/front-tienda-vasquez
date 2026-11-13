import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { Perfil } from '@/core/access-control/perfil.model';
import { Persona } from '@/features/personas/models/persona.model';
import { PersonaSubmission } from '@/features/personas/models/persona-submission.model';
import { PersonasApi } from '@/features/personas/api/personas.api';
import { personasKeys } from './personas.keys';

interface ActualizarPersona extends PersonaSubmission {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class PersonasMutations {
  private readonly api = inject(PersonasApi);
  private readonly queryClient = inject(QueryClient);
  private readonly auth = inject(AuthService);

  crear() {
    return mutationOptions({
      mutationKey: [...personasKeys.all, 'crear'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ datos, foto }: PersonaSubmission) =>
        firstValueFrom(this.api.crear(datos, foto)),
      onSuccess: (persona, _variables, sessionVersion) =>
        this.actualizarCache(persona, sessionVersion),
    });
  }

  actualizar() {
    return mutationOptions({
      mutationKey: [...personasKeys.all, 'actualizar'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, datos, foto }: ActualizarPersona) =>
        firstValueFrom(this.api.actualizar(id, datos, foto)),
      onSuccess: (persona, _variables, sessionVersion) =>
        this.actualizarCache(persona, sessionVersion),
    });
  }

  private async actualizarCache(persona: Persona, sessionVersion: number | undefined) {
    if (sessionVersion !== this.auth.sessionVersion) return;
    await this.queryClient.cancelQueries({ queryKey: personasKeys.detalle(persona.id) });
    if (sessionVersion !== this.auth.sessionVersion) return;
    this.queryClient.setQueryData(personasKeys.detalle(persona.id), persona);
    await this.queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === personasKeys.all[0] && query.queryKey[1] !== 'detalle',
    });
    if (sessionVersion !== this.auth.sessionVersion) return;
    // El listado y los selectores de usuarios incluyen datos públicos de la persona.
    await this.queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    if (sessionVersion !== this.auth.sessionVersion) return;
    const perfilKey = ['perfil', this.auth.userId(), sessionVersion] as const;
    if (this.queryClient.getQueryData<Perfil>(perfilKey)?.persona?.id === persona.id) {
      await this.queryClient.invalidateQueries({ queryKey: perfilKey });
    }
  }
}
