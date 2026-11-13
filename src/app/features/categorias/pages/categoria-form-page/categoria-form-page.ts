import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { map } from 'rxjs';
import { LucideArrowLeft, LucideSave, LucideLayers } from '@lucide/angular';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { CategoriasQueries } from '../../queries/categorias.queries';
import { CategoriasMutations } from '../../queries/categorias.mutations';
@Component({
  selector: 'app-categoria-form-page',
  imports: [FormsModule, RouterLink, LucideArrowLeft, LucideSave, LucideLayers],
  templateUrl: './categoria-form-page.html',
})
export class CategoriaFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly queries = inject(CategoriasQueries);
  private readonly mutations = inject(CategoriasMutations);
  protected readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  protected readonly categoria = injectQuery(() => this.queries.obtener(this.id()));
  protected readonly guardar = injectMutation(() => this.mutations.guardar());
  protected readonly error = signal('');
  protected nombre = '';
  protected descripcion = '';
  private inicializado = '';
  constructor() {
    effect(() => {
      const id = this.id();
      const data = this.categoria.data();
      if (!id) {
        if (this.inicializado) {
          this.nombre = '';
          this.descripcion = '';
          this.inicializado = '';
        }
      } else if (data && data.id === id && this.inicializado !== id) {
        this.nombre = data.nombre;
        this.descripcion = data.descripcion ?? '';
        this.inicializado = id;
      }
    });
  }
  protected enviar() {
    const nombre = this.nombre.trim();
    if (
      !nombre ||
      nombre.length > 100 ||
      this.descripcion.trim().length > 500 ||
      this.guardar.isPending()
    )
      return;
    this.error.set('');
    const version = this.auth.sessionVersion;
    this.guardar.mutate(
      { id: this.id(), datos: { nombre, descripcion: this.descripcion.trim() || null } },
      {
        onSuccess: () => {
          if (version === this.auth.sessionVersion)
            void this.router.navigate(['/admin/categorias']);
        },
        onError: (error) => {
          if (version === this.auth.sessionVersion)
            this.error.set(apiErrorMessage(error, 'No se pudo guardar la categoría.'));
        },
      },
    );
  }
  protected loadError() {
    return apiErrorMessage(this.categoria.error(), 'No se pudo cargar la categoría.');
  }
}
