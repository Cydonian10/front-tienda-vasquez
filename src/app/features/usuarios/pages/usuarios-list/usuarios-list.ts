import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { LucidePlus, LucideSearch, LucideShield, LucideUsers } from '@lucide/angular';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Pagination } from '@/shared/components/pagination/pagination';
import { Usuario } from '../../models/usuario.model';
import { UsuariosQueries } from '../../queries/usuarios.queries';
import { UsuarioInfoDialog } from './usuario-info-dialog';

@Component({
  selector: 'app-usuarios-list',
  imports: [RouterLink, DataTable, Pagination, LucidePlus, LucideSearch, LucideShield, LucideUsers],
  templateUrl: './usuarios-list.html',
})
export class UsuariosListPage {
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  private readonly dialog = inject(Dialog);
  private readonly navigationMessage =
    inject(Router).currentNavigation()?.extras.state?.['usuarioMessage'];
  protected readonly message =
    typeof this.navigationMessage === 'string' ? this.navigationMessage : '';
  private readonly queries = inject(UsuariosQueries);
  protected readonly usuarios = injectQuery(() => this.queries.listar());
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly filtrados = computed(() => {
    const search = this.search().trim().toLocaleLowerCase();
    return (this.usuarios.data() ?? []).filter((user) =>
      `${user.nickname} ${user.email} ${user.persona?.nombres ?? ''} ${user.persona?.apellidos ?? ''}`
        .toLocaleLowerCase()
        .includes(search),
    );
  });
  protected readonly visibles = computed(() =>
    this.filtrados().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize),
  );

  constructor() {
    effect(() => {
      const lastPage = Math.max(1, Math.ceil(this.filtrados().length / this.pageSize));
      if (this.page() > lastPage) this.page.set(lastPage);
    });
  }

  protected buscar(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }
  protected informacion(usuario: Usuario) {
    this.dialog.open(UsuarioInfoDialog, {
      data: usuario,
      ariaLabelledBy: 'usuario-info-title',
      backdropClass: 'person-dialog-backdrop',
    });
  }
}
