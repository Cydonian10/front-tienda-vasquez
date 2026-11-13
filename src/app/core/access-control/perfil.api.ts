import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Perfil } from './perfil.model';

@Injectable({ providedIn: 'root' })
export class PerfilApi {
  private readonly http = inject(HttpClient);

  obtener() {
    return this.http.get<Perfil>(`${environment.apiUrl}/auth/me`);
  }
}
