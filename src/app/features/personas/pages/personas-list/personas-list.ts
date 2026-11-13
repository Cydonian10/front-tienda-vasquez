import { Router, RouterLink } from '@angular/router';
import { Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideUsers,
  LucideUserRoundPlus,
} from '@lucide/angular';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Pagination } from '@/shared/components/pagination/pagination';
import { Persona } from '@/features/personas/models/persona.model';
import { PersonasQueries } from '@/features/personas/queries/personas.queries';
import { apiErrorMessage } from '@/core/errors/api-error';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';

@Component({
  selector: 'app-personas-page',
  imports: [
    RouterLink,
    DataTable,
    Pagination,
    LucidePencil,
    LucidePlus,
    LucideSearch,
    LucideUsers,
    LucideUserRoundPlus,
  ],
  templateUrl: './personas-list.html',
  styleUrl: './personas-list.css',
})
export class PersonasListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly queries = inject(PersonasQueries);
  private readonly searchChanges = new Subject<string>();
  protected readonly searchInput = signal('');
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  private readonly navigationMessage =
    inject(Router).currentNavigation()?.extras.state?.['personaMessage'];
  protected readonly message =
    typeof this.navigationMessage === 'string' ? this.navigationMessage : '';
  protected readonly personas = injectQuery(() =>
    this.queries.listar(this.page(), this.pageSize, this.search()),
  );

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.page.set(1);
        this.search.set(value.trim());
      });
    effect(() => {
      const result = this.personas.data();
      if (
        result &&
        this.personas.isSuccess() &&
        result.page === this.page() &&
        this.page() > Math.max(1, result.totalPages)
      ) {
        this.page.set(Math.max(1, result.totalPages));
      }
    });
  }

  protected updateSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.set(value);
    this.searchChanges.next(value);
  }
  protected listError(): string {
    return apiErrorMessage(this.personas.error(), 'No se pudo cargar el listado de personas.');
  }
  protected initials(persona: Persona): string {
    return `${persona.nombres[0] || ''}${persona.apellidos[0] || ''}`.toLocaleUpperCase();
  }
}
