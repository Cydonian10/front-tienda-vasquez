import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucidePanelTop } from '@lucide/angular';

@Component({
  selector: 'app-admin-page',
  imports: [LucidePanelTop],
  template: `
    <main class="workspace">
      <div class="workspace-heading">
        <div>
          <p class="eyebrow"><span></span> Tu espacio de trabajo</p>
          <h1>{{ label }}</h1>
          <p class="subtitle">
            {{
              label === 'Inicio'
                ? 'Bienvenido a tu espacio de trabajo.'
                : 'Tu espacio de ' + label.toLowerCase() + '.'
            }}
          </p>
        </div>
      </div>
      <section class="placeholder" [attr.aria-label]="label">
        <div class="placeholder-content">
          <span class="placeholder-icon"
            ><svg lucidePanelTop [size]="24" [strokeWidth]="1.7" aria-hidden="true"></svg
          ></span>
          <h2>
            {{ label === 'Inicio' ? 'Tu espacio está listo' : 'Aquí irá ' + label.toLowerCase() }}
          </h2>
          <p>Este espacio está listo para agregar el contenido de esta sección.</p>
        </div>
        <span class="placeholder-caption"><span></span> Espacio de trabajo</span>
      </section>
      <p class="workspace-footer">Tienda Vasquez · Tu espacio, a tu manera</p>
    </main>
  `,
  styleUrl: './admin.css',
})
export class AdminPage {
  protected readonly label = inject(ActivatedRoute).snapshot.data['label'] as string;
}
