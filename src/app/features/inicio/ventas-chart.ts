import { Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);
export interface VentaDia { fecha: string; total: string; }
@Component({
  selector: 'app-ventas-chart',
  template: `<div class="chart"><canvas #canvas role="img" aria-label="Ventas diarias de los últimos siete días"></canvas></div><table class="sr-only"><caption>Ventas diarias en soles</caption><tbody>@for (dia of datos(); track dia.fecha) { <tr><th>{{ dia.fecha }}</th><td>{{ dia.total }}</td></tr> }</tbody></table>`,
  styles: [`.chart{height:250px;position:relative}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`],
})
export class VentasChart implements OnDestroy {
  readonly datos = input.required<VentaDia[]>();
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;
  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const datos = this.datos();
      if (!canvas) return;
      this.chart?.destroy();
      const color = getComputedStyle(canvas).getPropertyValue('--color-secondary').trim() || '#747fea';
      this.chart = new Chart(canvas, { type: 'bar', data: { labels: datos.map(d => new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${d.fecha}T12:00:00Z`))), datasets: [{ data: datos.map(d => Number(d.total)), backgroundColor: color, borderRadius: 6, maxBarThickness: 34 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: item => `S/ ${Number(item.raw).toFixed(2)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: value => `S/ ${value}` }, grid: { color: 'rgba(128,128,128,.18)' }, border: { display: false } }, x: { grid: { display: false }, border: { display: false } } } } });
    });
  }
  ngOnDestroy() { this.chart?.destroy(); }
}
