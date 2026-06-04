import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExcelHospitalarioService } from '../../services/excel-hospitalario.service';
import { ResumenCargaExcel } from '../../models/resumen-carga-excel';

@Component({
  selector: 'app-carga-excel',
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-excel.component.html',
  styleUrl: './carga-excel.component.css'
})
export class CargaExcelComponent {

  archivoSeleccionado: File | null = null;

  idUsuario: number = 1;
  idIpress: number = 1;

  cargando: boolean = false;
  descargando: boolean = false;

  error: string = '';
  resultado: ResumenCargaExcel | null = null;

  constructor(private excelService: ExcelHospitalarioService) {}

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.archivoSeleccionado = null;
      return;
    }

    const archivo = input.files[0];

    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.error = 'Solo se permite cargar archivos con formato .xlsx.';
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
      this.error = 'Selecciona un archivo Excel antes de cargar.';
      return;
    }

    if (!this.idUsuario || this.idUsuario <= 0) {
      this.error = 'Ingresa un idUsuario válido.';
      return;
    }

    if (!this.idIpress || this.idIpress <= 0) {
      this.error = 'Ingresa un idIpress válido.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.resultado = null;

    this.excelService.cargarExcel(
      this.archivoSeleccionado,
      this.idUsuario,
      this.idIpress
    ).subscribe({
      next: (respuesta) => {
        this.resultado = respuesta;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar Excel:', error);
        this.error = 'No se pudo cargar el archivo. Verifica el backend, el usuario, la IPRESS y el formato del Excel.';
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
    return this.resultado?.estadoValidacion === 'VALIDADO'
      && this.resultado?.estadoProcesamiento === 'PROCESADO';
  }
}