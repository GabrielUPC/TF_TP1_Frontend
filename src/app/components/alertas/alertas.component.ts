import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { DashboardService } from '../../services/dashboard.service';
import { DashboardDetalle } from '../../models/dashboard-detalle';

@Component({
  selector: 'app-alertas',
  imports: [CommonModule],
  templateUrl: './alertas.component.html',
  styleUrl: './alertas.component.css'
})
export class AlertasComponent implements OnInit {

  alertas: DashboardDetalle[] = [];
  alertasFiltradas: DashboardDetalle[] = [];

  cargando: boolean = false;
  error: string = '';

  filtroRiesgo: string = 'TODOS';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.cargando = true;
    this.error = '';

    this.dashboardService.obtenerAlertas().subscribe({
      next: (data) => {
        this.alertas = data;
        this.alertasFiltradas = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar alertas:', error);
        this.error = 'No se pudieron cargar las alertas. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltroRiesgo(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroRiesgo = select.value;

    if (this.filtroRiesgo === 'TODOS') {
      this.alertasFiltradas = this.alertas;
      return;
    }

    this.alertasFiltradas = this.alertas.filter(alerta =>
      alerta.nivelRiesgo?.toUpperCase() === this.filtroRiesgo
    );
  }

  limpiarFiltro(): void {
    this.filtroRiesgo = 'TODOS';
    this.alertasFiltradas = this.alertas;
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
    contarRiesgoAlto(): number {
    return this.alertas.filter(alerta => alerta.nivelRiesgo?.toUpperCase() === 'ALTO').length;
  }

  contarRiesgoMedio(): number {
    return this.alertas.filter(alerta => alerta.nivelRiesgo?.toUpperCase() === 'MEDIO').length;
  }
}