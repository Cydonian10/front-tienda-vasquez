import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideMoon, LucideSun } from '@lucide/angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LucideMoon, LucideSun],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly overlayContainer = inject(OverlayContainer);
  protected readonly theme = signal<'vasquez-dark' | 'vasquez-light'>(this.loadTheme());

  constructor() {
    effect(() => {
      // CDK overlays live outside the themed application element.
      this.overlayContainer.getContainerElement().setAttribute('data-theme', this.theme());
    });
  }

  protected toggleTheme(): void {
    const theme = this.theme() === 'vasquez-dark' ? 'vasquez-light' : 'vasquez-dark';
    this.theme.set(theme);
    try {
      localStorage.setItem('vasquez-theme', theme);
    } catch {
      // El selector sigue funcionando durante la sesión si no hay almacenamiento disponible.
    }
  }

  private loadTheme(): 'vasquez-dark' | 'vasquez-light' {
    try {
      return localStorage.getItem('vasquez-theme') === 'vasquez-light' ? 'vasquez-light' : 'vasquez-dark';
    } catch {
      return 'vasquez-dark';
    }
  }
}
