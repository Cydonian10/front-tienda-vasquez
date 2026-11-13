export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface Session {
  accessToken: string;
  expiresAt: number;
  userId: string;
  method: 'Google' | 'Contraseña';
}
