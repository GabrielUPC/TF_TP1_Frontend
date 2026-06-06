import { Injectable } from '@angular/core';
import { SesionUsuario } from '../models/sesion-usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private storageKey = 'usuario_ipress';

  constructor() {}

  loginDemo(correo: string, contrasena: string): boolean {
    if (!correo || !contrasena) {
      return false;
    }

    let usuario: SesionUsuario;

    if (correo.toLowerCase().includes('admin')) {
      usuario = {
        nombre: 'María Elena Vargas',
        correo: correo,
        rol: 'ADMINISTRADOR',
        nombreRol: 'Administrador de la plataforma',
        ipressAsignada: 'IPRESS asociadas: 5'
      };
    } else if (correo.toLowerCase().includes('admision')) {
      usuario = {
        nombre: 'Carla Mendoza Rojas',
        correo: correo,
        rol: 'ADMISION_REGISTROS',
        nombreRol: 'Responsable de información hospitalaria',
        ipressAsignada: 'Hospital Nacional Sergio E. Bernales'
      };
    } else {
      usuario = {
        nombre: 'María Elena Vargas',
        correo: correo,
        rol: 'ATENCION_HOSPITALIZACION',
        nombreRol: 'Responsable de gestión hospitalaria',
        ipressAsignada: 'Hospital Nacional Sergio E. Bernales'
      };
    }

    localStorage.setItem(this.storageKey, JSON.stringify(usuario));

    return true;
  }

  obtenerUsuarioActual(): SesionUsuario | null {
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as SesionUsuario;
  }

  estaAutenticado(): boolean {
    return this.obtenerUsuarioActual() !== null;
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.storageKey);
  }

  tieneRol(rol: string): boolean {
    const usuario = this.obtenerUsuarioActual();

    if (!usuario) {
      return false;
    }

    return usuario.rol === rol;
  }
}