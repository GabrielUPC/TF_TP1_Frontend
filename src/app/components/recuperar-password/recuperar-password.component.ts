import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-password.component.html',
  styleUrl: './recuperar-password.component.css'
})
export class RecuperarPasswordComponent {

  correo: string = '';
  mensaje: string = '';
  error: string = '';

  enviarEnlace(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.correo) {
      this.error = 'Ingresa tu correo institucional.';
      return;
    }

    this.mensaje = 'Se enviará un enlace de recuperación al correo institucional registrado.';
  }
}