import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  NuevoUsuario,
  PaginaPersonas,
  PersonaDetalle,
  RolUsuario,
  Usuario,
  UsuarioDatos,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  listar() {
    return this.http.get<Usuario[]>(this.url);
  }
  obtener(id: string) {
    return this.http.get<Usuario>(`${this.url}/${encodeURIComponent(id)}`);
  }
  crear(datos: NuevoUsuario) {
    return this.http.post<Usuario>(`${this.url}/admin`, datos);
  }
  actualizar(id: string, datos: UsuarioDatos) {
    return this.http.put<Usuario>(`${this.url}/${encodeURIComponent(id)}`, datos);
  }
  roles(id: string) {
    return this.http.get<RolUsuario[]>(`${this.url}/${encodeURIComponent(id)}/roles`);
  }
  asignarRoles(id: string, rolIds: string[]) {
    return this.http.put<RolUsuario[]>(`${this.url}/${encodeURIComponent(id)}/roles`, { rolIds });
  }
  catalogoRoles() {
    return this.http.get<RolUsuario[]>(`${environment.apiUrl}/roles`);
  }
  buscarPersonas(page: number, nombre: string) {
    return this.http.get<PaginaPersonas>(`${environment.apiUrl}/personas`, {
      params: { page, limit: 10, ...(nombre ? { nombre } : {}) },
    });
  }
  persona(id: string) {
    return this.http.get<PersonaDetalle>(
      `${environment.apiUrl}/personas/${encodeURIComponent(id)}`,
    );
  }
}
