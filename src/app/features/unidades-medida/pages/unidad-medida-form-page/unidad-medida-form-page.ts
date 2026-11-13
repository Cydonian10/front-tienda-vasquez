import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { map } from 'rxjs';
import { LucideArrowLeft, LucideSave, LucideLayers } from '@lucide/angular';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { UnidadesMedidaQueries } from '../../queries/unidades-medida.queries';
import { UnidadesMedidaMutations } from '../../queries/unidades-medida.mutations';
@Component({
  selector: 'app-unidad-medida-form-page',
  imports: [FormsModule, RouterLink, LucideArrowLeft, LucideSave, LucideLayers],
  templateUrl: './unidad-medida-form-page.html',
})
export class UnidadMedidaFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly queries = inject(UnidadesMedidaQueries);
  private readonly mutations = inject(UnidadesMedidaMutations);
  protected readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  protected readonly unidadMedida = injectQuery(() => this.queries.obtener(this.id()));
  protected readonly guardar = injectMutation(() => this.mutations.guardar());
  protected readonly error = signal('');
  protected nombre = '';
  protected abreviatura = '';
  private inicializado = '';
  constructor() {
    effect(() => {
      const id = this.id();
      const data = this.unidadMedida.data();
      if (!id) {
        if (this.inicializado) {
          this.nombre = '';
          this.abreviatura = '';
          this.inicializado = '';
        }
      } else if (data && data.id === id && this.inicializado !== id) {
        this.nombre = data.nombre;
        this.abreviatura = data.abreviatura ?? '';
        this.inicializado = id;
      }
    });
  }
  protected enviar() {
    const nombre = this.nombre.trim();
    if (
      !nombre ||
      nombre.length > 100 ||
      !this.abreviatura.trim() ||
      this.abreviatura.trim().length > 20 ||
      this.guardar.isPending()
    )
      return;
    this.error.set('');
    const version = this.auth.sessionVersion;
    this.guardar.mutate(
      { id: this.id(), datos: { nombre, abreviatura: this.abreviatura.trim() } },
      {
        onSuccess: () => {
          if (version === this.auth.sessionVersion)
            void this.router.navigate(['/admin/unidades-medida']);
        },
        onError: (error) => {
          if (version === this.auth.sessionVersion)
            this.error.set(apiErrorMessage(error, 'No se pudo guardar la unidad de medida.'));
        },
      },
    );
  }
  protected loadError() {
    return apiErrorMessage(this.unidadMedida.error(), 'No se pudo cargar la unidad de medida.');
  }
}
