import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('Authentication guards', () => {
  const auth = { accessToken: null as string | null };
  beforeEach(() => {
    auth.accessToken = null;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  function check(guard: typeof authGuard) {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('redirects anonymous visitors away from admin', () => {
    expect(check(authGuard)).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
  });
  it('allows authenticated visitors into admin', () => {
    auth.accessToken = 'valid-token';
    expect(check(authGuard)).toBe(true);
  });
  it('allows anonymous visitors into login', () => {
    expect(check(guestGuard)).toBe(true);
  });
  it('redirects authenticated visitors away from login', () => {
    auth.accessToken = 'valid-token';
    expect(check(guestGuard)).toEqual(TestBed.inject(Router).createUrlTree(['/admin']));
  });
});
