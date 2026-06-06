import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  correo: string = '';
  contrasena: string = '';
  mostrarContrasena: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarSesion(): void {
    this.error = '';

    if (!this.correo || !this.contrasena) {
      this.error = 'Ingresa tu correo institucional y contraseña.';
      return;
    }

    const accesoValido = this.authService.loginDemo(this.correo, this.contrasena);

    if (!accesoValido) {
      this.error = 'Credenciales inválidas.';
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  alternarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }
}