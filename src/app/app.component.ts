import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';
import { SesionUsuario } from './models/sesion-usuario';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  title = 'TF_TP1_Frontend';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  esRutaAuth(): boolean {
    const rutaActual = this.router.url.split(/[?#]/)[0];
    return rutaActual === '/login' || rutaActual === '/recuperar-password';
  }

  obtenerUsuario(): SesionUsuario | null {
    return this.authService.obtenerUsuarioActual();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  esAdmin(): boolean {
    return this.authService.tieneRol('ADMINISTRADOR');
  }

  esAdmision(): boolean {
    return this.authService.tieneRol('ADMISION_REGISTROS');
  }

  esHospitalizacion(): boolean {
    return this.authService.tieneRol('ATENCION_HOSPITALIZACION');
  }
}
