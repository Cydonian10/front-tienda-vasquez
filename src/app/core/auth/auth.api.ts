import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenResponse } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, {
      email: email.trim().toLowerCase(),
      password,
    });
  }

  exchangeGoogleCode(code: string) {
    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/auth/oidc/google/exchange`,
      { code },
      { withCredentials: true },
    );
  }

  startGoogleLogin(): void {
    window.location.assign(`${environment.apiUrl}/auth/oidc/google/login`);
  }
}
