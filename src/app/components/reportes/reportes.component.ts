import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReporteService } from '../../services/reporte.service';
import { Reporte } from '../../models/reporte';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {

  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];

  cargando: boolean = false;
  error: string = '';

  filtroTexto: string = '';
  filtroRiesgo: string = 'TODOS';
  idArchivoBusqueda: number | null = null;

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.cargando = true;
    this.error = '';

    this.reporteService.listarReportes().subscribe({
      next: (data) => {
        this.reportes = data;
        this.reportesFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.error = 'No se pudieron cargar los reportes. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  buscarPorArchivo(): void {
    if (!this.idArchivoBusqueda || this.idArchivoBusqueda <= 0) {
      this.error = 'Ingresa un ID de archivo válido para buscar reportes.';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.reporteService.listarPorArchivo(this.idArchivoBusqueda).subscribe({
      next: (data) => {
        this.reportes = data;
        this.reportesFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar reportes por archivo:', error);
        this.error = 'No se encontraron reportes para el archivo indicado o el backend no está activo.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    const texto = this.filtroTexto.toLowerCase().trim();

    this.reportesFiltrados = this.reportes.filter(reporte => {
      const coincideTexto =
        reporte.nombreArchivo?.toLowerCase().includes(texto) ||
        reporte.servicioHospitalario?.toLowerCase().includes(texto) ||
        reporte.usuarioGenerador?.toLowerCase().includes(texto) ||
        reporte.modeloUtilizado?.toLowerCase().includes(texto);

      const coincideRiesgo =
        this.filtroRiesgo === 'TODOS' ||
        reporte.nivelRiesgo?.toUpperCase() === this.filtroRiesgo;

      return coincideTexto && coincideRiesgo;
    });
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroRiesgo = 'TODOS';
    this.idArchivoBusqueda = null;
    this.cargarReportes();
  }

  obtenerClaseRiesgo(nivelRiesgo: string | null | undefined): string {
    if (!nivelRiesgo) {
      return 'badge-bajo';
    }

    const riesgo = nivelRiesgo.toUpperCase();

    if (riesgo === 'ALTO') {
      return 'badge-alto';
    }

    if (riesgo === 'MEDIO') {
      return 'badge-medio';
    }

    return 'badge-bajo';
  }

  convertirPorcentaje(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '0%';
    }

    if (valor <= 1) {
      return `${(valor * 100).toFixed(2)}%`;
    }

    return `${valor.toFixed(2)}%`;
  }

  contarRiesgoAlto(): number {
    return this.reportes.filter(reporte => reporte.nivelRiesgo?.toUpperCase() === 'ALTO').length;
  }

  contarRiesgoMedio(): number {
    return this.reportes.filter(reporte => reporte.nivelRiesgo?.toUpperCase() === 'MEDIO').length;
  }

  contarRiesgoBajo(): number {
    return this.reportes.filter(reporte => reporte.nivelRiesgo?.toUpperCase() === 'BAJO').length;
  }
}