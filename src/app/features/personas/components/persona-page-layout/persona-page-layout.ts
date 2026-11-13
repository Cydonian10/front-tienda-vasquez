import { Component, input, output } from '@angular/core';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-persona-page-layout',
  imports: [LucideArrowLeft],
  templateUrl: './persona-page-layout.html',
  styleUrl: './persona-page-layout.css',
})
export class PersonaPageLayout {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly cardLabel = input.required<string>();
  readonly backDisabled = input(false);
  readonly backLabel = input('Volver a personas');
  readonly back = output<void>();
}
