import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

const key = 'tienda-vasquez.session';
function jwt(seconds = 900, amr = ['pwd']): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + seconds, amr })}.signature`;
}

describe('Authentication and HTTP integration', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  function login(token = jwt()) {
    const auth = TestBed.inject(AuthService);
    auth.login(' USUARIO@EJEMPLO.COM ', 'secret').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.body).toEqual({ email: 'usuario@ejemplo.com', password: 'secret' });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: token, expiresIn: 900 });
    return auth;
  }

  it('starts without a session', () => {
    expect(TestBed.inject(AuthService).accessToken).toBeNull();
  });

  it('saves a password session without saving the password', () => {
    const token = jwt();
    const auth = login(token);
    expect(auth.accessToken).toBe(token);
    expect(auth.userId()).toBe('user-123');
    expect(auth.session()?.method).toBe('Contraseña');
    expect(sessionStorage.getItem(key)).not.toContain('secret');
  });

  it('restores a valid session on reload', () => {
    const token = jwt();
    sessionStorage.setItem(
      key,
      JSON.stringify({ accessToken: token, expiresAt: Date.now() + 900_000 }),
    );
    expect(TestBed.inject(AuthService).accessToken).toBe(token);
  });

  it.each([
    'not-json',
    JSON.stringify({ accessToken: 'bad', expiresAt: Date.now() + 900_000 }),
    JSON.stringify({ accessToken: jwt(-1), expiresAt: Date.now() + 900_000 }),
  ])('discards malformed or expired stored sessions (%s)', (stored) => {
    sessionStorage.setItem(key, stored);
    expect(TestBed.inject(AuthService).accessToken).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it('exchanges the Google code with the browser cookie', () => {
    const auth = TestBed.inject(AuthService);
    auth.exchangeGoogleCode('one-time-code').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/auth/oidc/google/exchange`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ code: 'one-time-code' });
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ accessToken: jwt(900, ['oidc:google']), expiresIn: 900 });
    expect(auth.session()?.method).toBe('Google');
  });

  it('only attaches the JWT to protected requests to our API', () => {
    const token = jwt();
    login(token);
    const client = TestBed.inject(HttpClient);
    client.get(`${environment.apiUrl}/users`).subscribe();
    const protectedRequest = http.expectOne(`${environment.apiUrl}/users`);
    expect(protectedRequest.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    protectedRequest.flush([]);
    for (const url of [
      'https://external.example/users',
      `${environment.apiUrl}.evil.example/users`,
    ]) {
      client.get(url).subscribe();
      const external = http.expectOne(url);
      expect(external.request.headers.has('Authorization')).toBe(false);
      external.flush([]);
    }
  });

  it('clears the session and redirects on a protected 401', () => {
    const auth = login();
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}/users`)
      .subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}/users`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.accessToken).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { expired: '1' },
      replaceUrl: true,
    });
  });

  it('does not treat incorrect credentials as session expiry', () => {
    const auth = TestBed.inject(AuthService);
    auth.login('user@example.com', 'bad-password').subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.accessToken).toBeNull();
  });

  it('rejects invalid tokens returned by the API', () => {
    const auth = TestBed.inject(AuthService);
    const error = vi.fn();
    auth.login('user@example.com', 'password').subscribe({ error });
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ accessToken: 'not-a-jwt', expiresIn: 900 });
    expect(error).toHaveBeenCalledOnce();
    expect(auth.accessToken).toBeNull();
  });

  it('expires the session automatically', () => {
    vi.useFakeTimers();
    const auth = login(jwt(1));
    vi.advanceTimersByTime(1100);
    expect(auth.accessToken).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { expired: '1' },
      replaceUrl: true,
    });
  });

  it('clears the session on logout', () => {
    const auth = login();
    auth.logout();
    expect(auth.session()).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: {}, replaceUrl: true });
  });
});
