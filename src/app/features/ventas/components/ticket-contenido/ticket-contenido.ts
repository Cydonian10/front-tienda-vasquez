import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TicketVenta } from '../../models/venta.model';
@Component({ selector: 'app-ticket-contenido', imports: [DatePipe, DecimalPipe], templateUrl: './ticket-contenido.html' })
export class TicketContenido { readonly ticket = input.required<TicketVenta>(); }
