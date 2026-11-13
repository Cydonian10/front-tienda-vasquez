import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GrupoPermisos, NuevoRol, PermisoRol, Rol, RolDatos } from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class RolesApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/roles`;
  listar() {
    return this.http.get<Rol[]>(this.url);
  }
  obtener(id: string) {
    return this.http.get<Rol>(`${this.url}/${encodeURIComponent(id)}`);
  }
  crear(datos: NuevoRol) {
    return this.http.post<Rol>(this.url, datos);
  }
  actualizar(id: string, datos: RolDatos) {
    return this.http.put<Rol>(`${this.url}/${encodeURIComponent(id)}`, datos);
  }
  eliminar(id: string) {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`);
  }
  asignarPermisos(id: string, permisoIds: string[]) {
    return this.http.put<Rol>(`${this.url}/${encodeURIComponent(id)}/permisos`, { permisoIds });
  }
  catalogo(origen: 'features' | 'permisos') {
    if (origen === 'features')
      return this.http.get<GrupoPermisos[]>(`${environment.apiUrl}/features`);
    return this.http.get<PermisoRol[]>(`${environment.apiUrl}/permisos`).pipe(
      map((permisos) => {
        const groups = new Map<string, GrupoPermisos>();
        for (const permiso of permisos) {
          const codigo = permiso.codigo.split('.')[0];
          if (!groups.has(permiso.featureId))
            groups.set(permiso.featureId, {
              id: permiso.featureId,
              codigo,
              nombre: codigo,
              permisos: [],
            });
          groups.get(permiso.featureId)!.permisos.push(permiso);
        }
        return [...groups.values()];
      }),
    );
  }
}
