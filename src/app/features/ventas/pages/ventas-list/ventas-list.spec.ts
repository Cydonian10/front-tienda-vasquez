import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { environment } from '../../../../../environments/environment';
import { VentasList } from './ventas-list';

describe('Historial de ventas', () => {
  let client: QueryClient;
  let http: HttpTestingController;
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ imports: [VentasList], providers: [provideHttpClient(), provideHttpClientTesting(), provideTanStackQuery(client), { provide: AuthService, useValue: { sessionVersion: 1 } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); client.clear(); TestBed.resetTestingModule(); });
  it('carga el día actual y permite filtrar un rango válido', async () => {
    const fixture = TestBed.createComponent(VentasList); fixture.detectChanges();
    const first = await vi.waitFor(() => http.expectOne((r) => r.url === `${environment.apiUrl}/ventas`));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(first.request.params.get('fechaInicio')).toBe(today);
    expect(first.request.params.get('fechaFin')).toBe(today);
    first.flush({ items: [], total: 0, totalPages: 0 });
    const setDate = (id: string, value: string) => { const input = fixture.nativeElement.querySelector(id) as HTMLInputElement; input.value = value; input.dispatchEvent(new Event('input')); fixture.detectChanges(); };
    setDate('#fecha-inicio', '2026-11-01'); setDate('#fecha-fin', '2026-11-13');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true })); fixture.detectChanges();
    const filtered = await vi.waitFor(() => http.expectOne((r) => r.url === `${environment.apiUrl}/ventas`));
    expect(filtered.request.params.get('fechaInicio')).toBe('2026-11-01');
    expect(filtered.request.params.get('fechaFin')).toBe('2026-11-13');
    filtered.flush({ items: [], total: 0, totalPages: 0 });
    setDate('#fecha-inicio', '2026-11-14');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true })); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingresa un rango de fechas válido');
    http.expectNone((r) => r.url === `${environment.apiUrl}/ventas`);
  });
});
