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

  private readonly storageKey = 'usuario_ipress';
  private readonly jwtHelper = new JwtHelperService();

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

    try {
      return JSON.parse(data) as SesionUsuario;
    } catch {
      this.cerrarSesion();
      return null;
    }
  }

  obtenerToken(): string | null {
    return this.obtenerUsuarioActual()?.jwttoken ?? null;
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();

    if (!token) {
      return false;
    }

    try {
      const estaVigente = !this.jwtHelper.isTokenExpired(token);

      if (!estaVigente) {
        this.cerrarSesion();
      }

      return estaVigente;
    } catch {
      this.cerrarSesion();
      return false;
    }
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(this.storageKey);
  }

  tieneRol(rol: string): boolean {
    const usuario = this.obtenerUsuarioActual();
    return usuario?.rol === rol;
  }

  obtenerRutaInicial(rol: string): string | null {
    switch (rol) {
      case 'ADMINISTRADOR':
        return '/inicio';
      case 'ADMISION_REGISTROS':
        return '/carga-excel';
      case 'ATENCION_HOSPITALIZACION':
        return '/dashboard';
      default:
        return null;
    }
  }

  private obtenerNombreRol(rol: string): string {
  switch (rol) {
    case 'ADMINISTRADOR':
      return 'Administrador de la plataforma';
    case 'ADMISION_REGISTROS':
      return 'Oficina de Admisión y Registros Médicos';
    case 'ATENCION_HOSPITALIZACION':
      return 'Oficina de Atención de Hospitalización';
    default:
      return rol;
  }
}
}
