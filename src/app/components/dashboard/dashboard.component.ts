import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardResumen } from '../../models/dashboard-resumen';
import { DashboardDetalle } from '../../models/dashboard-detalle';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  resumen: DashboardResumen | null = null;
  detalle: DashboardDetalle[] = [];
  alertas: DashboardDetalle[] = [];

  anioFiltro: number | undefined;
  mesFiltro: number | undefined;
  servicioFiltro: string = '';
  aniosDisponibles: number[] = [];
  readonly meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  cargando: boolean = false;
  error: string = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.anioFiltro = undefined;
    this.mesFiltro = undefined;
    this.servicioFiltro = '';
    this.cargando = true;
    this.error = '';

    forkJoin({
      resumen: this.dashboardService.obtenerResumen(),
      detalle: this.dashboardService.obtenerDetalle(),
      alertas: this.dashboardService.obtenerAlertas()
    }).subscribe({
      next: (data) => {
        this.resumen = data.resumen;
        this.detalle = data.detalle;
        this.alertas = data.alertas;
        this.aniosDisponibles = [...new Set(data.detalle.map((item) => item.anio))]
          .sort((a, b) => b - a);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.error = 'No se pudo cargar el dashboard. Verifica que el backend esté activo en http://localhost:8080.';
        this.cargando = false;
      }
    });
  }

  filtrarDashboard(): void {
    this.cargando = true;
    this.error = '';

    const servicio = this.servicioFiltro.trim() || undefined;

    this.dashboardService.filtrar(
      this.anioFiltro,
      this.mesFiltro,
      servicio
    ).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al filtrar dashboard:', error);
        this.error = 'No se pudo filtrar el dashboard. Intenta nuevamente.';
        this.cargando = false;
      }
    });
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

  mostrarNumero(valor: number | null | undefined): number {
    return valor ?? 0;
  }
}
