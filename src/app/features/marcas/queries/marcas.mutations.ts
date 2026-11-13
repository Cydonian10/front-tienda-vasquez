import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { Marca, MarcaDatos } from '../models/marca.model';
import { MarcasApi } from '../api/marcas.api';
import { marcasKeys } from './marcas.keys';

@Injectable({ providedIn: 'root' })
export class MarcasMutations {
  private readonly api = inject(MarcasApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);
  guardar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, datos }: { id: string; datos: MarcaDatos }) =>
        firstValueFrom(id ? this.api.actualizar(id, datos) : this.api.crear(datos)),
      onSuccess: (marca, _, version) => this.actualizarCache(marca, version),
    });
  }
  eliminar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (id: string) => firstValueFrom(this.api.eliminar(id)),
      onSuccess: async (_, id, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.cancelQueries({ queryKey: marcasKeys.detail(id) });
        if (version !== this.auth.sessionVersion) return;
        this.client.removeQueries({ queryKey: marcasKeys.detail(id) });
        await this.client.invalidateQueries({ queryKey: marcasKeys.lists });
      },
    });
  }
  private async actualizarCache(marca: Marca, version: number | undefined) {
    if (version !== this.auth.sessionVersion) return;
    await this.client.cancelQueries({ queryKey: marcasKeys.detail(marca.id) });
    if (version !== this.auth.sessionVersion) return;
    this.client.setQueryData(marcasKeys.detail(marca.id), marca);
    await this.client.invalidateQueries({ queryKey: marcasKeys.lists });
  }
}
