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

  anioFiltro: number | null = null;
  mesFiltro: number | null = null;
  servicioFiltro: string = '';
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
    this.anioFiltro = null;
    this.mesFiltro = null;
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
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.error = 'No se pudo cargar el dashboard. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  filtrarDashboard(): void {
    this.cargando = true;
    this.error = '';

    const servicio = this.servicioFiltro.trim() || undefined;

    this.dashboardService.filtrar(
      this.anioFiltro ?? undefined,
      this.mesFiltro ?? undefined,
      servicio
    ).subscribe({
      next: (data) => {
        this.detalle = data;
        this.alertas = data.filter((item) => {
          const riesgo = item.nivelRiesgo?.toUpperCase();
          return riesgo === 'MEDIO' || riesgo === 'ALTO';
        });
        this.resumen = this.construirResumenDesdeDetalle(data);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al filtrar dashboard:', error);
        this.error = 'No se pudo filtrar la información del dashboard.';
        this.cargando = false;
      }
    });
  }

  private construirResumenDesdeDetalle(data: DashboardDetalle[]): DashboardResumen {
    const totalPredicciones = data.length;

    const totalRiesgoAlto = data.filter(
      (item) => item.nivelRiesgo?.toUpperCase() === 'ALTO'
    ).length;
    const totalRiesgoMedio = data.filter(
      (item) => item.nivelRiesgo?.toUpperCase() === 'MEDIO'
    ).length;
    const totalRiesgoBajo = data.filter(
      (item) => item.nivelRiesgo?.toUpperCase() === 'BAJO'
    ).length;

    const promedioOcupacionEstimada = this.promedio(
      data.map((item) => item.ocupacionEstimada)
    );
    const promedioPresionIngresosCamas = this.promedio(
      data.map((item) => item.presionIngresosCamas)
    );
    const promedioProbabilidad = this.promedio(
      data.map((item) => item.probabilidad)
    );

    const totalIngresos = this.sumar(data.map((item) => item.ingresos));
    const totalEgresos = this.sumar(data.map((item) => item.egresos));
    const totalEstancias = this.sumar(data.map((item) => item.estancias));
    const totalPacientesCama = this.sumar(data.map((item) => item.pacientesCama));
    const totalCamasDisponiblesHabilitadas = this.sumar(
      data.map((item) => item.camasDisponiblesHabilitadas)
    );

    const nivelRiesgoPredominante = this.obtenerRiesgoPredominante(
      totalRiesgoBajo,
      totalRiesgoMedio,
      totalRiesgoAlto
    );

    return {
      totalPredicciones,
      totalRiesgoBajo,
      totalRiesgoMedio,
      totalRiesgoAlto,
      promedioOcupacionEstimada,
      promedioPresionIngresosCamas,
      promedioProbabilidad,
      totalIngresos,
      totalEgresos,
      totalEstancias,
      totalPacientesCama,
      totalCamasDisponiblesHabilitadas,
      nivelRiesgoPredominante,
      mensajeResumen: this.generarMensajeResumen(
        nivelRiesgoPredominante,
        totalPredicciones
      )
    };
  }

  private promedio(valores: Array<number | null | undefined>): number {
    const validos = valores.filter(
      (valor): valor is number => valor !== null && valor !== undefined
    );

    if (validos.length === 0) {
      return 0;
    }

    const suma = validos.reduce((acc, valor) => acc + valor, 0);
    return Math.round((suma / validos.length) * 100) / 100;
  }

  private sumar(valores: Array<number | null | undefined>): number {
    return valores
      .filter((valor): valor is number => valor !== null && valor !== undefined)
      .reduce((acc, valor) => acc + valor, 0);
  }

  private obtenerRiesgoPredominante(bajo: number, medio: number, alto: number): string {
    if (alto >= medio && alto >= bajo && alto > 0) {
      return 'ALTO';
    }

    if (medio >= alto && medio >= bajo && medio > 0) {
      return 'MEDIO';
    }

    if (bajo > 0) {
      return 'BAJO';
    }

    return 'SIN DATOS';
  }

  private generarMensajeResumen(
    riesgoPredominante: string,
    totalPredicciones: number
  ): string {
    if (totalPredicciones === 0) {
      return 'No existen registros para los filtros seleccionados.';
    }

    if (riesgoPredominante === 'ALTO') {
      return 'Según los filtros aplicados, predomina el riesgo alto de insuficiencia de capacidad asistencial.';
    }

    if (riesgoPredominante === 'MEDIO') {
      return 'Según los filtros aplicados, predomina el riesgo medio y se recomienda seguimiento preventivo.';
    }

    if (riesgoPredominante === 'BAJO') {
      return 'Según los filtros aplicados, predomina el riesgo bajo.';
    }

    return 'No se pudo determinar un riesgo predominante.';
  }

  limpiarFiltros(): void {
    this.anioFiltro = null;
    this.mesFiltro = null;
    this.servicioFiltro = '';
    this.cargarDashboard();
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
