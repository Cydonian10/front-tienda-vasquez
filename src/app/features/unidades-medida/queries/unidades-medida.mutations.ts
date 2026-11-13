import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { UnidadMedida, UnidadMedidaDatos } from '../models/unidad-medida.model';
import { UnidadesMedidaApi } from '../api/unidades-medida.api';
import { unidadesMedidaKeys } from './unidades-medida.keys';
@Injectable({ providedIn: 'root' })
export class UnidadesMedidaMutations {
  private readonly api = inject(UnidadesMedidaApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);
  guardar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, datos }: { id: string; datos: UnidadMedidaDatos }) =>
        firstValueFrom(id ? this.api.actualizar(id, datos) : this.api.crear(datos)),
      onSuccess: (unidadMedida, _, version) => this.actualizarCache(unidadMedida, version),
    });
  }
  eliminar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (id: string) => firstValueFrom(this.api.eliminar(id)),
      onSuccess: async (_, id, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.cancelQueries({ queryKey: unidadesMedidaKeys.detail(id) });
        if (version !== this.auth.sessionVersion) return;
        this.client.removeQueries({ queryKey: unidadesMedidaKeys.detail(id) });
        await this.client.invalidateQueries({ queryKey: unidadesMedidaKeys.lists });
      },
    });
  }
  private async actualizarCache(unidadMedida: UnidadMedida, version: number | undefined) {
    if (version !== this.auth.sessionVersion) return;
    await this.client.cancelQueries({ queryKey: unidadesMedidaKeys.detail(unidadMedida.id) });
    if (version !== this.auth.sessionVersion) return;
    this.client.setQueryData(unidadesMedidaKeys.detail(unidadMedida.id), unidadMedida);
    await this.client.invalidateQueries({ queryKey: unidadesMedidaKeys.lists });
  }
}
