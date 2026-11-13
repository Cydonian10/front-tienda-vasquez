import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilAccess } from '@/core/access-control/perfil-access';

@Component({
  selector: 'app-acceso-page',
  imports: [RouterLink],
  template: `
    <main class="p-6">
      @if (route.snapshot.queryParamMap.get('motivo') === 'error') {
        <h1 class="text-2xl font-bold">No se pudo cargar tu perfil</h1>
        <p role="alert">Comprueba tu conexión y vuelve a intentarlo.</p>
        <button
          class="btn btn-primary mt-4"
          type="button"
          [disabled]="retrying()"
          (click)="retry()"
        >
          {{ retrying() ? 'Reintentando...' : 'Reintentar' }}
        </button>
      } @else {
        <h1 class="text-2xl font-bold">Acceso denegado</h1>
        <p role="alert">Tu cuenta no tiene los permisos necesarios para acceder a esta sección.</p>
      }
      <a class="btn btn-ghost mt-4" routerLink="/admin">Volver al inicio</a>
    </main>
  `,
})
export class AccesoPage {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly access = inject(PerfilAccess);
  protected readonly retrying = signal(false);

  protected async retry(): Promise<void> {
    this.retrying.set(true);
    try {
      const result = await this.access.perfil.refetch();
      if (result.isSuccess) {
        const target = this.route.snapshot.queryParamMap.get('volver');
        await this.router.navigateByUrl(target?.startsWith('/admin/') ? target : '/admin');
      }
    } finally {
      this.retrying.set(false);
    }
  }
}
