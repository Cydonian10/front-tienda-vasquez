export interface EmpresaDatos {
  razonSocial: string;
  nombreComercial: string;
  actividad: string;
  tipoDocumento: string;
  numeroDocumento: string;
  tipoEmpresa: string;
  direccion: string;
  telefono: string;
  correo: string;
}

export type Empresa = { [K in keyof EmpresaDatos]: string | null } & {
  id: number;
  logoUrl: string | null;
};
