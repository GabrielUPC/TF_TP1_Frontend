import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ExcelHospitalarioService } from '../../services/excel-hospitalario.service';
import { ResumenCargaExcel } from '../../models/resumen-carga-excel';
import { AuthService } from '../../services/auth.service';
import { SesionUsuario } from '../../models/sesion-usuario';

@Component({
  selector: 'app-carga-excel',
  imports: [CommonModule],
  templateUrl: './carga-excel.component.html',
  styleUrl: './carga-excel.component.css'
})
export class CargaExcelComponent {

  archivoSeleccionado: File | null = null;

  cargando: boolean = false;
  descargando: boolean = false;

  error: string = '';
  resultado: ResumenCargaExcel | null = null;

  constructor(
    private excelService: ExcelHospitalarioService,
    private authService: AuthService
  ) {}

  obtenerUsuario(): SesionUsuario | null {
    return this.authService.obtenerUsuarioActual();
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.archivoSeleccionado = null;
      return;
    }

    const archivo = input.files[0];

    const nombre = archivo.name.toLowerCase();

    if (!nombre.endsWith('.xlsx') && !nombre.endsWith('.csv')) {
      this.error = 'Solo se permiten archivos hospitalarios .csv o .xlsx.';
      this.archivoSeleccionado = null;
      input.value = '';
      return;
    }

    this.error = '';
    this.resultado = null;
    this.archivoSeleccionado = archivo;
  }

  descargarPlantilla(): void {
    this.descargando = true;
    this.error = '';

    this.excelService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');

        enlace.href = url;
        enlace.download = 'plantilla_hospitalizacion_ipress.xlsx';
        enlace.click();

        window.URL.revokeObjectURL(url);
        this.descargando = false;
      },
      error: (error) => {
        console.error('Error al descargar plantilla:', error);
        this.error = 'No se pudo descargar la plantilla. Verifica que el backend esté activo.';
        this.descargando = false;
      }
    });
  }

  cargarExcel(): void {
    if (!this.archivoSeleccionado) {
      this.error = 'Selecciona un archivo hospitalario antes de cargar.';
      return;
    }

    const usuario = this.authService.obtenerUsuarioActual();

    if (!usuario) {
      this.error = 'No se encontró una sesión de usuario válida. Vuelve a iniciar sesión.';
      return;
    }

    if (!usuario.idUsuario || usuario.idUsuario <= 0) {
      this.error = 'No se encontró un identificador de usuario válido. Vuelve a iniciar sesión.';
      return;
    }

    if (!usuario.idIpress || usuario.idIpress <= 0) {
      this.error = 'El usuario no tiene una IPRESS asignada. Verifica la configuración del usuario.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.resultado = null;

    this.excelService.cargarExcel(
      this.archivoSeleccionado,
      usuario.idUsuario,
      usuario.idIpress
    ).subscribe({
      next: (respuesta) => {
        this.resultado = respuesta;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar Excel:', error);
        this.error = error?.error?.message
          || 'No se pudo cargar el archivo. Verifica el backend, el usuario, la IPRESS y el formato hospitalario.';
        this.cargando = false;
      }
    });
  }

  limpiar(): void {
    this.archivoSeleccionado = null;
    this.resultado = null;
    this.error = '';

    const input = document.getElementById('archivoExcel') as HTMLInputElement;

    if (input) {
      input.value = '';
    }
  }

  esCargaExitosa(): boolean {
    return ['VALIDADO', 'VALIDADO_CON_PENDIENTES'].includes(this.resultado?.estadoValidacion || '')
      && ['PROCESADO', 'PROCESADO_PARCIAL'].includes(this.resultado?.estadoProcesamiento || '');
  }

  tienePendientes(): boolean {
    return (this.resultado?.totalGruposPendientes || 0) > 0;
  }
}
