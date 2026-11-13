import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { Categoria, CategoriaDatos } from '../models/categoria.model';
import { CategoriasApi } from '../api/categorias.api';
import { categoriasKeys } from './categorias.keys';
@Injectable({ providedIn: 'root' })
export class CategoriasMutations {
  private readonly api = inject(CategoriasApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthService);
  guardar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ id, datos }: { id: string; datos: CategoriaDatos }) =>
        firstValueFrom(id ? this.api.actualizar(id, datos) : this.api.crear(datos)),
      onSuccess: (categoria, _, version) => this.actualizarCache(categoria, version),
    });
  }
  eliminar() {
    return mutationOptions({
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: (id: string) => firstValueFrom(this.api.eliminar(id)),
      onSuccess: async (_, id, version) => {
        if (version !== this.auth.sessionVersion) return;
        await this.client.cancelQueries({ queryKey: categoriasKeys.detail(id) });
        if (version !== this.auth.sessionVersion) return;
        this.client.removeQueries({ queryKey: categoriasKeys.detail(id) });
        await this.client.invalidateQueries({ queryKey: categoriasKeys.lists });
      },
    });
  }
  private async actualizarCache(categoria: Categoria, version: number | undefined) {
    if (version !== this.auth.sessionVersion) return;
    await this.client.cancelQueries({ queryKey: categoriasKeys.detail(categoria.id) });
    if (version !== this.auth.sessionVersion) return;
    this.client.setQueryData(categoriasKeys.detail(categoria.id), categoria);
    await this.client.invalidateQueries({ queryKey: categoriasKeys.lists });
  }
}
