import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { PaginaPersonas, Persona, PersonaDatos } from '@/features/personas/models/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonasApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/personas`;

  listar(page: number, limit: number, nombre: string) {
    return this.http.get<PaginaPersonas>(this.url, {
      params: { page, limit, ...(nombre ? { nombre } : {}) },
    });
  }

  obtener(id: string) {
    return this.http.get<Persona>(`${this.url}/${encodeURIComponent(id)}`);
  }

  crear(datos: PersonaDatos, foto: File | null) {
    return this.http.post<Persona>(this.url, this.formData(datos, foto));
  }

  actualizar(id: string, datos: PersonaDatos, foto: File | null) {
    return this.http.put<Persona>(
      `${this.url}/${encodeURIComponent(id)}`,
      this.formData(datos, foto),
    );
  }

  private formData(datos: PersonaDatos, foto: File | null): FormData {
    const body = new FormData();
    body.append('data', JSON.stringify(datos));
    if (foto) body.append('foto', foto);
    return body;
  }
}
