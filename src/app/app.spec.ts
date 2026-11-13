import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the route outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('cambia y recuerda el tema elegido', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(root.querySelector('[data-theme]')?.getAttribute('data-theme')).toBe('vasquez-dark');
    expect(overlay.getAttribute('data-theme')).toBe('vasquez-dark');
    root.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(root.querySelector('[data-theme]')?.getAttribute('data-theme')).toBe('vasquez-light');
    expect(overlay.getAttribute('data-theme')).toBe('vasquez-light');
    expect(localStorage.getItem('vasquez-theme')).toBe('vasquez-light');
    const next = TestBed.createComponent(App);
    next.detectChanges();
    expect((next.nativeElement as HTMLElement).querySelector('[data-theme]')?.getAttribute('data-theme')).toBe('vasquez-light');
    expect(overlay.getAttribute('data-theme')).toBe('vasquez-light');
  });
});
