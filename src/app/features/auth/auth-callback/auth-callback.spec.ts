import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { AuthCallbackPage } from './auth-callback';

describe('Google callback', () => {
  const auth = { exchangeGoogleCode: vi.fn() };
  const code = 'a'.repeat(43);

  beforeEach(() => {
    auth.exchangeGoogleCode
      .mockReset()
      .mockReturnValue(of({ accessToken: 'token', expiresIn: 900 }));
    window.history.replaceState(null, '', `/auth/callback#code=${code}`);
    TestBed.configureTestingModule({
      imports: [AuthCallbackPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => window.history.replaceState(null, '', '/'));

  it('removes the code from the URL, exchanges it once and opens admin', () => {
    const fixture = TestBed.createComponent(AuthCallbackPage);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(window.location.hash).toBe('');
    expect(auth.exchangeGoogleCode).toHaveBeenCalledExactlyOnceWith(code);
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/admin', {
      replaceUrl: true,
    });
  });

  it.each(['/auth/callback', '/auth/callback#code=bad-code', '/auth/callback#error=access_denied'])(
    'rejects invalid callbacks (%s)',
    (url) => {
      window.history.replaceState(null, '', url);
      const fixture = TestBed.createComponent(AuthCallbackPage);
      fixture.detectChanges();
      expect(auth.exchangeGoogleCode).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('no es válido');
    },
  );

  it('offers a retry when the code has expired', () => {
    auth.exchangeGoogleCode.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    const fixture = TestBed.createComponent(AuthCallbackPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('venció o ya fue utilizado');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/login');
  });
});
