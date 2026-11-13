import { DatePipe } from '@angular/common';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { DialogShell } from '@/shared/components/dialog-shell/dialog-shell';
import { Pagination } from '@/shared/components/pagination/pagination';
import { TextField } from '@/shared/components/text-field/text-field';
import { VentasApi } from '../../api/ventas.api';
import { VentasQueries } from '../../queries/ventas.queries';
import { TicketContenido } from '../../components/ticket-contenido/ticket-contenido';

function fechaLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
@Component({
  selector: 'app-ventas-list',
  imports: [DatePipe, DialogShell, Pagination, TextField, TicketContenido],
  templateUrl: './ventas-list.html',
})
export class VentasList {
  private readonly queries = inject(VentasQueries);
  private readonly api = inject(VentasApi);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(Dialog);
  private readonly ticketTemplate = viewChild.required<TemplateRef<unknown>>('ticketDialog');
  private ticketRef?: DialogRef;
  protected readonly inicio = signal(fechaLocal());
  protected readonly fin = signal(this.inicio());
  protected readonly filtros = signal({ inicio: this.inicio(), fin: this.fin() });
  protected readonly page = signal(1);
  protected readonly errorFiltro = signal('');
  protected readonly ticketId = signal('');
  protected readonly ticketError = signal('');
  protected readonly imprimiendo = signal(false);
  protected readonly ventas = injectQuery(() => this.queries.listar(this.filtros().inicio, this.filtros().fin, this.page()));
  protected readonly ticket = injectQuery(() => this.queries.ticket(this.ticketId()));
  constructor() { this.destroyRef.onDestroy(() => this.ticketRef?.close()); }
  protected aplicar() {
    if (!this.inicio() || !this.fin() || this.inicio() > this.fin()) {
      this.errorFiltro.set('Ingresa un rango de fechas válido.'); return;
    }
    this.errorFiltro.set(''); this.page.set(1);
    this.filtros.set({ inicio: this.inicio(), fin: this.fin() });
  }
  protected abrirTicket(id: string) {
    if (this.ticketRef) return;
    this.ticketId.set(id); this.ticketError.set('');
    const ref = this.dialog.open(this.ticketTemplate(), { ariaLabelledBy: 'ticket-historial-title', backdropClass: 'person-dialog-backdrop' });
    this.ticketRef = ref;
    ref.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.ticketRef = undefined; this.ticketId.set(''); });
  }
  protected cerrarTicket() { this.ticketRef?.close(); }
  protected async imprimirTicket() {
    if (!this.ticketId() || this.imprimiendo()) return;
    const ventana = window.open('', '_blank');
    if (!ventana) { this.ticketError.set('Permite las ventanas emergentes para abrir el PDF.'); return; }
    const version = this.auth.sessionVersion;
    this.imprimiendo.set(true); this.ticketError.set('');
    try {
      const blob = await firstValueFrom(this.api.ticketPdf(this.ticketId()));
      if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) { ventana.close(); return; }
      const url = URL.createObjectURL(blob); ventana.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000); ventana.focus();
    } catch {
      ventana.close();
      if (!this.destroyRef.destroyed && version === this.auth.sessionVersion) this.ticketError.set('No se pudo generar el PDF. Intenta nuevamente.');
    } finally { if (!this.destroyRef.destroyed) this.imprimiendo.set(false); }
  }
}
