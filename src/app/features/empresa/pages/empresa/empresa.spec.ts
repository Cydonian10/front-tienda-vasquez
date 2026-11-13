import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../../../../environments/environment';
import { EmpresaPage } from './empresa';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { signal } from '@angular/core';

const company = {
  id: 1,
  razonSocial: 'Tienda',
  nombreComercial: null,
  actividad: null,
  tipoDocumento: 'RUC',
  numeroDocumento: '123',
  tipoEmpresa: null,
  direccion: 'Jauja',
  telefono: null,
  correo: null,
  logoUrl: 'https://example.com/logo.png',
};

describe('EmpresaPage', () => {
  let http: HttpTestingController;
  const canEdit = signal(true);
  beforeEach(() => {
    canEdit.set(true);
    TestBed.configureTestingModule({
      imports: [EmpresaPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: PerfilAccess, useValue: { puede: () => canEdit() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('shows saved information and allows editing and cancellation', async () => {
    const fixture = TestBed.createComponent(EmpresaPage);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/empresa`).flush(company);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Editar información');
    });
    const input = fixture.nativeElement.querySelector('#razonSocial') as HTMLInputElement;
    expect(input.value).toBe('Tienda');
    expect(input.disabled).toBe(true);
    (fixture.nativeElement.querySelector('.footer-actions button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input.disabled).toBe(false);
    input.value = 'Otra tienda';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.cancel-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input.value).toBe('Tienda');
    expect(input.disabled).toBe(true);
  });

  it('creates the company via multipart and shows the saved state', async () => {
    const fixture = TestBed.createComponent(EmpresaPage);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/empresa`).flush(null);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#razonSocial')).toBeTruthy();
    });
    for (const [id, value] of Object.entries({
      razonSocial: 'Tienda',
      numeroDocumento: '123',
      direccion: 'Jauja',
    })) {
      const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    const request = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/empresa`));
    expect(request.request.method).toBe('PUT');
    expect(JSON.parse(request.request.body.get('data')).razonSocial).toBe('Tienda');
    request.flush(company);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Información guardada correctamente');
    });
  });

  it('validates the logo and allows retrying a failed save', async () => {
    const fixture = TestBed.createComponent(EmpresaPage);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/empresa`).flush(company);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Editar información');
    });
    (fixture.nativeElement.querySelector('.footer-actions button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const fileInput = fixture.nativeElement.querySelector('#logo') as HTMLInputElement;
    const choose = (file: File) => {
      Object.defineProperty(fileInput, 'files', {
        configurable: true,
        value: { item: () => file },
      });
      fileInput.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    choose(new File(['bad'], 'bad.txt', { type: 'text/plain' }));
    expect(fixture.nativeElement.textContent).toContain('El logo debe ser PNG');
    const logo = new File(['image'], 'logo.png', { type: 'image/png' });
    choose(logo);
    const submit = () =>
      (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    submit();
    const first = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/empresa`));
    expect(first.request.body.get('logo')).toBe(logo);
    first.flush('error', { status: 500, statusText: 'Error' });
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('El servidor no está disponible');
    });
    submit();
    const retry = await vi.waitFor(() => http.expectOne(`${environment.apiUrl}/empresa`));
    retry.flush(company);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Información guardada correctamente');
    });
  });

  it('mantiene la información en solo lectura sin permiso de edición', async () => {
    canEdit.set(false);
    const fixture = TestBed.createComponent(EmpresaPage);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/empresa`).flush(company);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#razonSocial')).toBeTruthy();
    });
    expect(fixture.nativeElement.querySelector('#razonSocial').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.footer-actions button')).toBeNull();
  });

  it('retira la edición si el permiso se revoca mientras se edita', async () => {
    const fixture = TestBed.createComponent(EmpresaPage);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/empresa`).flush(company);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.footer-actions button')).toBeTruthy();
    });
    fixture.nativeElement.querySelector('.footer-actions button').click();
    fixture.detectChanges();
    canEdit.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#razonSocial').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.footer-actions button')).toBeNull();
  });
});
