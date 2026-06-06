export interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  estado: boolean;
  nombreRol: string;
  nombreIpress: string;
}

export interface UsuarioRegistro {
  idUsuario?: number | null;
  nombre: string;
  correo: string;
  contrasena: string;
  estado: boolean;
  idRol: number | null;
  idIpress: number | null;
}