import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardResumen } from '../../models/dashboard-resumen';
import { DashboardDetalle } from '../../models/dashboard-detalle';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  resumen: DashboardResumen | null = null;
  detalle: DashboardDetalle[] = [];
  alertas: DashboardDetalle[] = [];

  cargando: boolean = false;
  error: string = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
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
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.error = 'No se pudo cargar el dashboard. Verifica que el backend esté activo en http://localhost:8080.';
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