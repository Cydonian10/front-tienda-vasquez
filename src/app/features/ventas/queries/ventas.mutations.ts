import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { ventasKeys } from './ventas.keys';
import { VentasApi } from '../api/ventas.api';
import { VentaDatos } from '../models/venta.model';
@Injectable({ providedIn: 'root' })
export class VentasMutations {
  private readonly api = inject(VentasApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);
  crear() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (data: VentaDatos) => firstValueFrom(this.api.crear(data)),
      onSuccess: async (_result, _data, version) => {
        if (version !== this.auth.sessionVersion) return;
        await Promise.all([
          this.client.invalidateQueries({ queryKey: ventasKeys.listas }),
          this.client.invalidateQueries({ queryKey: ['inicio', 'ventas'] }),
          this.client.invalidateQueries({ queryKey: ventasKeys.productos }),
          this.client.invalidateQueries({ queryKey: ventasKeys.producto }),
          this.client.invalidateQueries({ queryKey: ['productos'] }),
        ]);
      },
    });
  }
}
