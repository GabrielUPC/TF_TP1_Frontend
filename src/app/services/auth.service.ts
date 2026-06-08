import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

import { environment } from '../../environment';
import { SesionUsuario } from '../models/sesion-usuario';
import { AuthResponse } from '../models/auth-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private storageKey = 'usuario_ipress';
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {}

  login(correo: string, contrasena: string): Observable<SesionUsuario> {
    return this.http.post<AuthResponse>(`${environment.base}/login`, {
      correo,
      contrasena
    }).pipe(
      map((response) => {
        const sesion: SesionUsuario = {
          jwttoken: response.jwttoken,
          idUsuario: response.idUsuario,
          nombre: response.nombre,
          correo: response.correo,
          rol: response.rol,
          nombreRol: this.obtenerNombreRol(response.rol),
          idIpress: response.idIpress,
          nombreIpress: response.nombreIpress,
          ipressAsignada: response.nombreIpress
        };

        sessionStorage.setItem(this.storageKey, JSON.stringify(sesion));
        return sesion;
      })
    );
  }

  obtenerUsuarioActual(): SesionUsuario | null {
    const data = sessionStorage.getItem(this.storageKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as SesionUsuario;
  }

  obtenerToken(): string | null {
    return this.obtenerUsuarioActual()?.jwttoken ?? null;
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();

    if (!token) {
      return false;
    }

    return !this.jwtHelper.isTokenExpired(token);
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.storageKey);
  }

  tieneRol(rol: string): boolean {
    const usuario = this.obtenerUsuarioActual();
    return usuario?.rol === rol;
  }

  private obtenerNombreRol(rol: string): string {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'Administrador de la plataforma';
      case 'ADMISION_REGISTROS':
        return 'Responsable de información hospitalaria';
      case 'ATENCION_HOSPITALIZACION':
        return 'Responsable de gestión hospitalaria';
      default:
        return rol;
    }
  }
}