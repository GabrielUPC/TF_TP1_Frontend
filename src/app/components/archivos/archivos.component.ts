import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { ArchivoService } from '../../services/archivo.service';
import { ArchivoCargado } from '../../models/archivo-cargado';

@Component({
  selector: 'app-archivos',
  imports: [CommonModule],
  templateUrl: './archivos.component.html',
  styleUrl: './archivos.component.css'
})
export class ArchivosComponent implements OnInit {

  archivos: ArchivoCargado[] = [];
  archivosFiltrados: ArchivoCargado[] = [];

  cargando: boolean = false;
  error: string = '';

  filtroTexto: string = '';
  filtroEstado: string = 'TODOS';

  constructor(private archivoService: ArchivoService) {}

  ngOnInit(): void {
    this.cargarArchivos();
  }

  cargarArchivos(): void {
    this.cargando = true;
    this.error = '';

    this.archivoService.listarArchivos().subscribe({
      next: (data) => {
        this.archivos = data;
        this.archivosFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al listar archivos:', error);
        this.error = 'No se pudo cargar el historial de archivos. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltroTexto(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroTexto = input.value.toLowerCase().trim();
    this.aplicarFiltros();
  }

  aplicarFiltroEstado(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroEstado = select.value;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.archivosFiltrados = this.archivos.filter(archivo => {
      const coincideTexto =
        archivo.nombreArchivo?.toLowerCase().includes(this.filtroTexto) ||
        archivo.nombreIpress?.toLowerCase().includes(this.filtroTexto) ||
        archivo.nombreUsuario?.toLowerCase().includes(this.filtroTexto);

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        archivo.estadoProcesamiento === this.filtroEstado ||
        archivo.estadoValidacion === this.filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroEstado = 'TODOS';
    this.archivosFiltrados = this.archivos;
  }

  obtenerClaseEstado(estado: string | null | undefined): string {
    if (!estado) {
      return 'badge-pendiente';
    }

    const estadoMayus = estado.toUpperCase();

    if (estadoMayus === 'VALIDADO' || estadoMayus === 'PROCESADO') {
      return 'badge-exito';
    }

    if (estadoMayus === 'ERROR') {
      return 'badge-error';
    }

    return 'badge-pendiente';
  }
}