import { inject, Injectable } from '@angular/core';
import { mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { EmpresaApi } from '@/features/empresa/api/empresa.api';
import { EmpresaDatos } from '@/features/empresa/models/empresa.model';
import { empresaKeys } from './empresa.keys';

@Injectable({ providedIn: 'root' })
export class EmpresaMutations {
  private readonly api = inject(EmpresaApi);
  private readonly queryClient = inject(QueryClient);
  private readonly auth = inject(AuthService);

  guardar() {
    return mutationOptions({
      mutationKey: [...empresaKeys.actual, 'guardar'],
      retry: false,
      onMutate: () => this.auth.sessionVersion,
      mutationFn: ({ datos, logo }: { datos: EmpresaDatos; logo: File | null }) =>
        firstValueFrom(this.api.guardar(datos, logo)),
      onSuccess: (empresa, _variables, sessionVersion) => {
        // Una respuesta de la sesión anterior no debe repoblar la caché.
        if (sessionVersion !== this.auth.sessionVersion) return;
        this.queryClient.setQueryData(empresaKeys.actual, empresa);
      },
    });
  }
}
