import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Empresa, EmpresaDatos } from '@/features/empresa/models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresa`;

  obtener() {
    return this.http.get<Empresa | null>(this.url);
  }

  guardar(datos: EmpresaDatos, logo: File | null) {
    const body = new FormData();
    body.append('data', JSON.stringify({ ...datos, correo: datos.correo.trim() }));
    if (logo) body.append('logo', logo);
    return this.http.put<Empresa>(this.url, body);
  }
}
