import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { ProductosApi } from '../api/productos.api';
@Injectable({ providedIn: 'root' })
export class ProductosMutations {
  private readonly api = inject(ProductosApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);
  editar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, data }: { id: string; data: FormData }) =>
        firstValueFrom(this.api.actualizar(id, data)),
      onSuccess: async (_, { id }, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.invalidateQueries({ queryKey: ['productos', 'detalle', id] });
        if (version === this.auth.sessionVersion)
          await this.client.invalidateQueries({ queryKey: ['productos', 'lista'] });
      },
    });
  }
  crear() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (data: FormData) => firstValueFrom(this.api.crear(data)),
      onSuccess: async (_, __, version) => {
        if (version === this.auth.sessionVersion)
          await this.client.invalidateQueries({ queryKey: ['productos', 'lista'] });
      },
    });
  }
}
