import { TicketContenido } from '../../components/ticket-contenido/ticket-contenido';
import { debounceTime, distinctUntilChanged, firstValueFrom, Subject } from 'rxjs';
import { VentasApi } from '../../api/ventas.api';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@/core/auth/auth.service';
import { DialogShell } from '@/shared/components/dialog-shell/dialog-shell';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { LucideArrowRight, LucideBox, LucideShoppingCart, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { TextField } from '@/shared/components/text-field/text-field';
import { SelectField } from '@/shared/components/select-field/select-field';
import { Pagination } from '@/shared/components/pagination/pagination';
import { VentasQueries } from '../../queries/ventas.queries';
import { VentasMutations } from '../../queries/ventas.mutations';
import { Medio, Persona, ProductoDetalle, ProductoLista, VentaDatos } from '../../models/venta.model';
interface Linea {
  producto: ProductoDetalle;
  marca: string;
  unidadId: string;
  cantidad: string;
}
@Component({
  selector: 'app-punto-venta',
  imports: [
    TicketContenido,
    DialogShell,
    TextField,
    SelectField,
    Pagination,
    LucideArrowRight,
    LucideBox,
    LucideShoppingCart,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './punto-venta.html',
})
export class PuntoVenta {
  private readonly queries = inject(VentasQueries);
  private readonly api = inject(VentasApi);
  private readonly mutations = inject(VentasMutations);
  private readonly queryClient = inject(QueryClient);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(Dialog);
  private readonly cobroTemplate = viewChild.required<TemplateRef<unknown>>('cobroDialog');
  private readonly ticketTemplate = viewChild.required<TemplateRef<unknown>>('ticketDialog');
  private ticketRef?: DialogRef;
  protected readonly ticketId = signal('');
  protected readonly imprimiendo = signal(false);
  protected readonly ticketError = signal('');
  private dialogRef?: DialogRef;
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  protected readonly nombre = signal('');
  private readonly busquedaProducto = new Subject<string>();
  private readonly nombreConsultado = signal('');
  protected readonly page = signal(1);
  protected readonly categoria = signal('');
  protected readonly imagenesFallidas = signal<ReadonlySet<string>>(new Set());
  protected readonly seleccionado = signal('');
  protected readonly clienteNombre = signal('');
  protected readonly buscandoCliente = signal(false);
  protected readonly clientePage = signal(1);
  protected readonly cliente = signal<Persona | null>(null);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly mensaje = signal('');
  protected readonly cobranza = signal(false);
  protected readonly productos = injectQuery(() =>
    this.queries.productos(this.page(), this.nombreConsultado(), this.categoria()),
  );
  protected readonly categorias = injectQuery(() => ({
    ...this.queries.categorias(),
    enabled: this.access.puede(PERMISOS.CATEGORIAS.LEER),
  }));
  protected readonly ticket = injectQuery(() => this.queries.ticket(this.ticketId()));
  protected readonly unidades = injectQuery(() => this.queries.unidades());
  protected readonly personas = injectQuery(() => ({
    ...this.queries.personas(this.clienteNombre(), this.clientePage()),
    enabled: this.cobranza() && this.buscandoCliente() && this.access.puede(PERMISOS.PERSONAS.LEER),
  }));
  protected readonly guardar = injectMutation(() => this.mutations.crear());
  protected modalidad: 'contado' | 'fiado' = 'contado';
  protected medio: Medio = 'efectivo';
  protected recibido = '';
  protected vencimiento = '';
  protected readonly modalidades = [
    { value: 'contado', label: 'Contado' },
    { value: 'fiado', label: 'Fiado' },
  ];
  protected readonly medios = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'tarjeta', label: 'Tarjeta' },
  ];
  protected readonly total = computed(() => this.lineas().reduce((s, l) => s + this.importe(l), 0));
  protected readonly Number = Number;
  private intento: VentaDatos | null = null;
  constructor() {
    this.busquedaProducto
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((nombre) => {
        this.page.set(1);
        this.nombreConsultado.set(nombre);
      });
    this.destroyRef.onDestroy(() => {
      this.dialogRef?.close();
      this.ticketRef?.close();
    });
  }
  protected buscarProducto(nombre: string) {
    this.nombre.set(nombre);
    this.busquedaProducto.next(nombre.trim());
  }
  protected seleccionarCategoria(id: string) {
    this.categoria.set(id);
    this.page.set(1);
  }
  protected imagenFallida(id: string) {
    this.imagenesFallidas.update((actual) => new Set([...actual, id]));
  }
  protected async agregar(producto: ProductoLista) {
    if (
      this.seleccionado() ||
      this.guardar.isPending() ||
      this.unidades.isPending() ||
      this.unidades.isError()
    )
      return;
    const { id, marca } = producto;
    const version = this.auth.sessionVersion;
    this.seleccionado.set(id);
    this.mensaje.set('');
    try {
      const p = await this.queryClient.fetchQuery(this.queries.producto(id));
      if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) return;
      const principal = p.unidades.find((u) => u.principal);
      if (!principal) {
        this.mensaje.set('El producto no tiene una unidad principal.');
        return;
      }
      this.lineas.update((ls) => [
        ...ls,
        { producto: p, marca, unidadId: principal.unidadId, cantidad: '1' },
      ]);
    } catch {
      if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
        this.mensaje.set('No se pudo cargar el producto. Selecciónalo nuevamente para reintentar.');
    } finally {
      if (!this.destroyRef.destroyed && this.seleccionado() === id) this.seleccionado.set('');
    }
  }
  protected abrirCobro() {
    if (!this.lineas().length || this.dialogRef) return;
    this.mensaje.set('');
    this.cobranza.set(true);
    const ref = this.dialog.open(this.cobroTemplate(), {
      ariaLabelledBy: 'cobro-venta-title',
      backdropClass: 'person-dialog-backdrop',
      disableClose: true,
    });
    this.dialogRef = ref;
    ref.backdropClick.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cerrarCobro());
    ref.keydownEvents.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cerrarCobro();
      }
    });
    ref.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dialogRef = undefined;
      this.cobranza.set(false);
    });
  }
  protected cerrarCobro() {
    if (!this.guardar.isPending()) this.dialogRef?.close();
  }
  protected abrirTicket(id: string) {
    this.ticketId.set(id);
    this.ticketError.set('');
    const ref = this.dialog.open(this.ticketTemplate(), {
      ariaLabelledBy: 'ticket-venta-title',
      backdropClass: 'person-dialog-backdrop',
    });
    this.ticketRef = ref;
    ref.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.ticketRef = undefined;
      this.ticketId.set('');
      this.ticketError.set('');
    });
  }
  protected cerrarTicket() {
    this.ticketRef?.close();
  }
  protected async imprimirTicket() {
    if (!this.ticketId() || this.imprimiendo()) return;
    const ventana = window.open('', '_blank');
    if (!ventana) {
      this.ticketError.set('Permite las ventanas emergentes para abrir el PDF.');
      return;
    }
    const version = this.auth.sessionVersion;
    this.imprimiendo.set(true);
    this.ticketError.set('');
    try {
      const blob = await firstValueFrom(this.api.ticketPdf(this.ticketId()));
      if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) {
        ventana.close();
        return;
      }
      const url = URL.createObjectURL(blob);
      ventana.location.href = url;
      // Keep the URL alive while the PDF viewer loads; the browser releases it on page unload.
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
      ventana.focus();
    } catch {
      ventana.close();
      if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
        this.ticketError.set('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      if (!this.destroyRef.destroyed) this.imprimiendo.set(false);
    }
  }
  protected precioUnidad(l: Linea) {
    return (
      Number(l.producto.precio) *
      Number(l.producto.unidades.find((u) => u.unidadId === l.unidadId)?.factor ?? 1)
    );
  }
  protected opcionesUnidades(p: ProductoDetalle) {
    return p.unidades.map((u) => ({
      value: u.unidadId,
      label: `${this.unidades.data()?.find((x) => x.id === u.unidadId)?.nombre ?? 'Unidad'} (×${Number(u.factor)})`,
    }));
  }
  protected importe(l: Linea) {
    return (
      Math.round(
        Number(l.producto.precio) *
          Number(l.producto.unidades.find((u) => u.unidadId === l.unidadId)?.factor ?? 1) *
          Number(l.cantidad) *
          100,
      ) / 100
    );
  }
  protected actualizar(i: number, key: 'unidadId' | 'cantidad', value: string) {
    this.lineas.update((ls) => ls.map((l, n) => (n === i ? { ...l, [key]: value } : l)));
  }
  protected quitar(i: number) {
    this.lineas.update((ls) => ls.filter((_, n) => n !== i));
  }
  protected seleccionarCliente(persona: Persona) {
    this.cliente.set(persona);
    this.buscandoCliente.set(false);
  }
  protected elegirModalidad(value: string) {
    this.modalidad = value as 'contado' | 'fiado';
  }
  protected elegirMedio(value: string) {
    this.medio = value as Medio;
  }
  protected confirmar() {
    this.mensaje.set('');
    const lineas = this.lineas();
    if (
      !lineas.length ||
      lineas.some((l) => !/^\d{1,10}(\.\d{1,4})?$/.test(l.cantidad) || Number(l.cantidad) <= 0)
    ) {
      this.mensaje.set('Ingresa cantidades válidas mayores que cero.');
      return;
    }
    if (this.modalidad === 'fiado' && !this.cliente()) {
      this.mensaje.set('Selecciona un cliente para la venta fiada.');
      return;
    }
    if (
      this.modalidad === 'contado' &&
      this.medio === 'efectivo' &&
      (!/^\d{1,14}(\.\d{1,2})?$/.test(this.recibido) || Number(this.recibido) < this.total())
    ) {
      this.mensaje.set('Ingresa un efectivo recibido válido y suficiente.');
      return;
    }
    const nuevo: VentaDatos = {
      operacionId: '',
      modalidad: this.modalidad,
      clienteId: this.cliente()?.id ?? null,
      vencimiento: this.modalidad === 'fiado' ? this.vencimiento || null : null,
      detalles: lineas.map((l) => ({
        productoId: l.producto.id,
        unidadId: l.unidadId,
        cantidad: l.cantidad,
      })),
      ...(this.modalidad === 'contado'
        ? {
            pago: {
              medio: this.medio,
              ...(this.medio === 'efectivo' ? { recibido: this.recibido } : {}),
            },
          }
        : {}),
    };
    const comparable = (v: VentaDatos) => JSON.stringify({ ...v, operacionId: '' });
    if (!this.intento || comparable(this.intento) !== comparable(nuevo))
      this.intento = { ...nuevo, operacionId: crypto.randomUUID() };
    const version = this.auth.sessionVersion;
    this.guardar.mutate(this.intento, {
      onSuccess: (v) => {
        if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) return;
        this.lineas.set([]);
        this.cliente.set(null);
        this.buscandoCliente.set(false);
        this.clienteNombre.set('');
        this.clientePage.set(1);
        this.recibido = '';
        this.vencimiento = '';
        this.dialogRef?.close();
        this.intento = null;
        this.mensaje.set('');
        this.abrirTicket(v.id);
      },
      onError: (e) => {
        if (this.destroyRef.destroyed || version !== this.auth.sessionVersion) return;
        const msg =
          e instanceof HttpErrorResponse && typeof e.error?.message === 'string'
            ? e.error.message
            : 'No se pudo registrar la venta. Comprueba la conexión y vuelve a intentar.';
        this.mensaje.set(msg);
      },
    });
  }
}
