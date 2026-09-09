import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { ArchivoProcesado } from '../../models/archivo-procesado';
import { DashboardDetalle } from '../../models/dashboard-detalle';
import { DashboardResumen } from '../../models/dashboard-resumen';
import {
  CatalogoPrediccionBinaria,
  PrediccionBinariaAutomaticaError,
  PrediccionBinariaAutomaticaResponse
} from '../../models/prediccion-binaria';
import { ArchivoService } from '../../services/archivo.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';

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
  catalogo: CatalogoPrediccionBinaria | null = null;
  archivosProcesados: ArchivoProcesado[] = [];
  idArchivoFiltro: number | null = null;
  servicioFiltro = '';
  anioFiltro: number | null = null;
  mesFiltro: number | null = null;
  resultado: PrediccionBinariaAutomaticaResponse | null = null;
  cargando = false;
  error = '';

  readonly meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private dashboardService: DashboardService,
    private prediccionService: PrediccionBinariaService,
    private archivoService: ArchivoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void { this.cargarDashboard(); }

  cargarDashboard(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({
      resumen: this.dashboardService.obtenerResumen(),
      detalle: this.dashboardService.obtenerDetalle(),
      alertas: this.dashboardService.obtenerAlertas(),
      catalogo: this.prediccionService.obtenerCatalogo(),
      archivos: this.archivoService.listarArchivosProcesados().pipe(catchError(() => of([])))
    }).subscribe({
      next: data => {
        this.resumen = data.resumen;
        this.detalle = data.detalle;
        this.alertas = data.alertas;
        this.catalogo = data.catalogo;
        this.archivosProcesados = data.archivos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el dashboard. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  analizarPeriodo(): void {
    if (!this.servicioFiltro || this.anioFiltro === null || this.mesFiltro === null) {
      this.error = 'Selecciona servicio, año y mes antes de analizar.';
      return;
    }
    const periodo = this.periodoSeleccionado;
    if (!periodo || !this.periodosDisponibles.includes(periodo)) {
      this.error = 'El periodo no tiene una ventana válida de seis meses consecutivos.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.resultado = null;
    this.prediccionService.predecir({
      servicio: this.servicioFiltro,
      periodo_actual: periodo
    }).pipe(
      switchMap(resultado => {
        this.resultado = resultado;
        return this.dashboardService.filtrar(
          this.idArchivoFiltro ?? undefined,
          this.anioFiltro ?? undefined,
          this.mesFiltro ?? undefined,
          this.servicioFiltro
        );
      })
    ).subscribe({
      next: detalle => {
        this.detalle = detalle;
        this.resumen = this.resumenDesdeDetalle(detalle);
        this.alertas = detalle.filter(item => item.alertaAltaPresion === true);
        this.cargando = false;
      },
      error: error => {
        const cuerpo = error?.error as PrediccionBinariaAutomaticaError | undefined;
        this.error = cuerpo?.mensaje || 'No fue posible analizar el periodo seleccionado.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.idArchivoFiltro = null;
    this.servicioFiltro = '';
    this.anioFiltro = null;
    this.mesFiltro = null;
    this.resultado = null;
    this.cargarDashboard();
  }

  alCambiarServicio(): void {
    this.anioFiltro = null; this.mesFiltro = null; this.resultado = null; this.error = '';
  }
  alCambiarAnio(): void {
    if (this.mesFiltro !== null && !this.mesesDisponibles.includes(this.mesFiltro)) {
      this.mesFiltro = null;
    }
    this.resultado = null; this.error = '';
  }

  get ipressAsignada(): string {
    return this.catalogo?.nombreIpress
      || this.authService.obtenerUsuarioActual()?.ipressAsignada
      || 'IPRESS no asignada';
  }
  get serviciosDisponibles(): string[] {
    return this.catalogo?.servicios.map(s => s.servicio) ?? [];
  }
  get periodosDisponibles(): string[] {
    return this.catalogo?.servicios.find(s => s.servicio === this.servicioFiltro)
      ?.periodosDisponibles ?? [];
  }
  get aniosDisponibles(): number[] {
    return [...new Set(this.periodosDisponibles.map(p => Number(p.slice(0, 4))))]
      .sort((a, b) => b - a);
  }
  get mesesDisponibles(): number[] {
    return this.periodosDisponibles
      .filter(p => Number(p.slice(0, 4)) === this.anioFiltro)
      .map(p => Number(p.slice(5, 7))).sort((a, b) => a - b);
  }
  get periodoSeleccionado(): string | null {
    return this.anioFiltro !== null && this.mesFiltro !== null
      ? `${this.anioFiltro}-${String(this.mesFiltro).padStart(2, '0')}` : null;
  }
  get registroSeleccionado(): DashboardDetalle | null {
    return this.detalle.find(d => d.anio === this.anioFiltro && d.mes === this.mesFiltro
      && d.servicioHospitalario === this.servicioFiltro) ?? this.detalle[0] ?? null;
  }
  get totalIngresos(): number { return this.sumar('ingresos'); }
  get totalEgresos(): number { return this.sumar('egresos'); }
  get totalEstancias(): number { return this.sumar('estancias'); }
  get totalPacientesCama(): number { return this.sumar('pacientesCama'); }
  get totalCamas(): number { return this.sumar('camasTotales'); }
  get totalDiasCama(): number { return this.sumar('totalCamasDisponibles'); }
  get ocupacionPromedio(): number { return this.promedio('ocupacionEstimada'); }
  get presionPromedio(): number { return this.promedio('presionIngresosCamas'); }
  get ultimaActualizacion(): string {
    const fecha = this.resultado ? new Date() : this.detalle.find(d => d.fechaPrediccion)?.fechaPrediccion;
    return fecha ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' })
      .format(new Date(fecha)) : 'Sin predicción reciente';
  }

  nombreMes(mes: number): string { return this.meses[mes - 1] ?? String(mes); }
  formatearNumero(valor: number | null | undefined, decimales = 0): string {
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: decimales }).format(valor ?? 0);
  }
  formatearPorcentaje(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? 'N/D' : `${(valor * 100).toFixed(1)}%`;
  }
  claseRiesgo(nivel?: string | null): string {
    return nivel ? `riesgo-${nivel.toLowerCase()}` : '';
  }

  private sumar(campo: keyof DashboardDetalle): number {
    return this.detalle.reduce((a, d) => a + (Number(d[campo]) || 0), 0);
  }
  private promedio(campo: keyof DashboardDetalle): number {
    const valores = this.detalle.map(d => Number(d[campo])).filter(Number.isFinite);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  }
  private resumenDesdeDetalle(d: DashboardDetalle[]): DashboardResumen {
    const predicciones = d.filter(x => x.idPrediccion != null);
    return {
      totalRegistros: d.length,
      totalPredicciones: predicciones.length,
      totalRiesgoBajo: predicciones.filter(x => x.nivelRiesgo === 'BAJO').length,
      totalRiesgoMedio: predicciones.filter(x => x.nivelRiesgo === 'MEDIO').length,
      totalRiesgoAlto: predicciones.filter(x => x.nivelRiesgo === 'ALTO').length,
      promedioOcupacionEstimada: this.promedio('ocupacionEstimada'),
      promedioPresionIngresosCamas: this.promedio('presionIngresosCamas'),
      promedioProbabilidadAltaPresion: predicciones.length
        ? predicciones.reduce((a, x) => a + (x.probabilidadAltaPresion ?? 0), 0) / predicciones.length : 0,
      totalIngresos: this.totalIngresos, totalEgresos: this.totalEgresos,
      totalEstancias: this.totalEstancias, totalPacientesCama: this.totalPacientesCama,
      totalCamasDisponiblesHabilitadas: this.sumar('camasDisponiblesHabilitadas'),
      totalDiasCamaDisponibles: this.totalDiasCama,
      nivelRiesgoPredominante: this.resultado?.nivel_riesgo ?? 'SIN DATOS',
      mensajeResumen: predicciones.length ? 'Predicción binaria vigente.' : 'Datos observados sin predicción.'
    };
  }
}
