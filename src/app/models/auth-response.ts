export interface AuthResponse {
  jwttoken: string;
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  idIpress: number | null;
  nombreIpress: string;
}