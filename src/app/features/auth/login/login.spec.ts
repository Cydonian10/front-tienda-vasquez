import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { LoginPage } from './login';

describe('Login page', () => {
  const auth = {
    login: vi.fn(),
    startGoogleLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    auth.login.mockReturnValue(of({ accessToken: 'token', expiresIn: 900 }));
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  function setup() {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const setInput = (id: string, value: string) => {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = () => {
      element
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
    };
    return { fixture, element, setInput, submit };
  }

  it('validates the form before calling the API', () => {
    const { element, submit } = setup();
    submit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(element.querySelector('#email-error')?.textContent).toContain('válido');
    expect(element.querySelector('#password-error')?.textContent).toContain('contraseña');
  });

  it('validates an invalid email after the field loses focus', () => {
    const { element, fixture, setInput, submit } = setup();
    setInput('email', 'correo-invalido');
    setInput('password', 'secret-password');
    element.querySelector<HTMLInputElement>('#email')!.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(element.querySelector('#email-error')?.textContent).toContain('válido');
    submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('applies the length limits from the signal form schema', () => {
    const { element } = setup();
    expect(element.querySelector<HTMLInputElement>('#email')?.maxLength).toBe(254);
    expect(element.querySelector<HTMLInputElement>('#password')?.maxLength).toBe(128);
  });

  it('logs in with the form and opens admin', () => {
    const { setInput, submit } = setup();
    setInput('email', 'user@example.com');
    setInput('password', 'secret-password');
    submit();
    expect(auth.login).toHaveBeenCalledWith('user@example.com', 'secret-password');
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/admin', {
      replaceUrl: true,
    });
  });

  it('shows a helpful error for incorrect credentials', () => {
    auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const { setInput, submit, element } = setup();
    setInput('email', 'user@example.com');
    setInput('password', 'wrong-password');
    submit();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('no son correctos');
    expect(element.querySelector<HTMLButtonElement>('[type="submit"]')?.disabled).toBe(false);
  });

  it('starts Google login', () => {
    const { element } = setup();
    element.querySelector<HTMLButtonElement>('.google-button')!.click();
    expect(auth.startGoogleLogin).toHaveBeenCalledOnce();
  });

  it('reenables login when returning from Google via the browser cache', () => {
    const { element, fixture } = setup();
    const googleButton = element.querySelector<HTMLButtonElement>('.google-button')!;
    googleButton.click();
    fixture.detectChanges();
    expect(googleButton.disabled).toBe(true);

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    fixture.detectChanges();
    expect(googleButton.disabled).toBe(false);
    expect(element.querySelector<HTMLButtonElement>('[type="submit"]')!.disabled).toBe(false);
    googleButton.click();
    expect(auth.startGoogleLogin).toHaveBeenCalledTimes(2);
  });

  it('reenables login if the Google redirect fails', () => {
    auth.startGoogleLogin.mockImplementation(() => { throw new Error('redirect failed'); });
    const { element, fixture } = setup();
    element.querySelector<HTMLButtonElement>('.google-button')!.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('.google-button')!.disabled).toBe(false);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Google');
  });

  it('toggles password visibility', () => {
    const { element, fixture } = setup();
    expect(element.querySelector<HTMLInputElement>('#password')?.type).toBe('password');
    element.querySelector<HTMLButtonElement>('.password-toggle')!.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#password')?.type).toBe('text');
  });
});
