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

type PrioridadGestion = 'ALTA' | 'MEDIA' | 'BAJA' | 'NO EVALUABLE';

interface AccionGestion {
  indicador: string;
  valor: string;
  prioridad: PrioridadGestion;
  interpretacion: string;
  accion: string;
  responsable: string;
}

interface BarraIngresos {
  servicio: string;
  valor: number;
  altura: number;
}

interface PuntoOcupacion {
  periodo: string;
  etiqueta: string;
  valor: number;
  x: number;
  y: number;
}

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
  datosActividad: DashboardDetalle[] = [];
  datosTendencia: DashboardDetalle[] = [];
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
        this.establecerDatosVisualesBase(data.detalle);
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
        const idArchivo = this.idArchivoFiltro ?? undefined;
        const anio = this.anioFiltro ?? undefined;
        const mes = this.mesFiltro ?? undefined;
        return forkJoin({
          detalle: this.dashboardService.filtrar(idArchivo, anio, mes, this.servicioFiltro),
          actividad: this.dashboardService.filtrar(idArchivo, anio, mes).pipe(catchError(() => of([]))),
          tendencia: this.dashboardService.filtrar(idArchivo, anio, undefined, this.servicioFiltro)
            .pipe(catchError(() => of([])))
        });
      })
    ).subscribe({
      next: data => {
        this.detalle = data.detalle;
        this.datosActividad = data.actividad;
        this.datosTendencia = data.tendencia.filter(item =>
          this.mesFiltro === null || item.mes <= this.mesFiltro
        );
        this.resumen = this.resumenDesdeDetalle(data.detalle);
        this.alertas = data.detalle.filter(item => item.alertaAltaPresion === true);
        this.cargando = false;
      },
      error: error => {
        const cuerpo = error?.error as PrediccionBinariaAutomaticaError | undefined;
        const detalle = typeof error?.error?.detail === 'string'
          ? error.error.detail
          : error?.error?.detail
            ? JSON.stringify(error.error.detail)
            : '';
        this.error = cuerpo?.mensaje || detalle || 'No fue posible analizar el periodo seleccionado.';
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
  get ocupacionPromedio(): number | null { return this.promedio('ocupacionEstimada'); }
  get presionPromedio(): number | null { return this.promedio('presionIngresosCamas'); }
  get ultimaActualizacion(): string {
    const fecha = this.resultado ? new Date() : this.detalle.find(d => d.fechaPrediccion)?.fechaPrediccion;
    return fecha ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' })
      .format(new Date(fecha)) : 'Sin predicción reciente';
  }

  get accionesSugeridas(): AccionGestion[] {
    return this.construirAccionesSugeridas(this.registroSeleccionado);
  }

  get barrasIngresos(): BarraIngresos[] {
    const acumulado = new Map<string, number>();
    this.datosActividad.forEach(item => acumulado.set(
      item.servicioHospitalario,
      (acumulado.get(item.servicioHospitalario) ?? 0) + (Number(item.ingresos) || 0)
    ));
    const principales = [...acumulado.entries()]
      .map(([servicio, valor]) => ({ servicio, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
    const maximo = Math.max(...principales.map(item => item.valor), 1);
    return principales.map(item => ({ ...item, altura: (item.valor / maximo) * 100 }));
  }

  get totalIngresosGrafico(): number {
    return this.barrasIngresos.reduce((total, item) => total + item.valor, 0);
  }

  get puntosOcupacion(): PuntoOcupacion[] {
    const periodos = new Map<string, { pacientesDia: number; diasCama: number; valores: number[] }>();
    this.datosTendencia.forEach(item => {
      const periodo = `${item.anio}-${String(item.mes).padStart(2, '0')}`;
      const actual = periodos.get(periodo) ?? { pacientesDia: 0, diasCama: 0, valores: [] };
      actual.pacientesDia += Number(item.pacientesCama) || 0;
      actual.diasCama += Number(item.totalCamasDisponibles) || 0;
      const ocupacion = this.numeroDisponible(item.ocupacionEstimada);
      if (ocupacion !== null) {
        actual.valores.push(ocupacion);
      }
      periodos.set(periodo, actual);
    });
    const valores = [...periodos.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, datos]) => {
        const valor = datos.diasCama > 0
          ? datos.pacientesDia / datos.diasCama
          : datos.valores.length
            ? datos.valores.reduce((a, b) => a + b, 0) / datos.valores.length
            : null;
        return valor === null ? null : {
          periodo,
          etiqueta: `${this.nombreMes(Number(periodo.slice(5, 7))).slice(0, 3)} ${periodo.slice(2, 4)}`,
          valor
        };
      })
      .filter((item): item is { periodo: string; etiqueta: string; valor: number } => item !== null);
    const maximo = Math.max(1, .9, ...valores.map(item => item.valor)) * 1.08;
    const ancho = 570;
    return valores.map((item, indice) => ({
      ...item,
      x: valores.length === 1 ? 320 : 36 + (indice * ancho / (valores.length - 1)),
      y: 210 - (item.valor / maximo) * 160
    }));
  }

  get lineaOcupacion(): string {
    return this.puntosOcupacion.map(punto => `${punto.x},${punto.y}`).join(' ');
  }

  get yUmbralOcupacion(): number {
    const maximo = Math.max(1, .9, ...this.puntosOcupacion.map(item => item.valor)) * 1.08;
    return 210 - (.9 / maximo) * 160;
  }

  get promedioOcupacionTendencia(): number {
    const puntos = this.puntosOcupacion;
    return puntos.length ? puntos.reduce((total, punto) => total + punto.valor, 0) / puntos.length : 0;
  }

  nombreMes(mes: number): string { return this.meses[mes - 1] ?? String(mes); }
  formatearNumero(valor: number | null | undefined, decimales = 0): string {
    const numero = this.numeroDisponible(valor);
    return numero === null
      ? 'N/D'
      : new Intl.NumberFormat('es-PE', { maximumFractionDigits: decimales }).format(numero);
  }
  formatearPorcentaje(valor: number | null | undefined): string {
    const numero = this.numeroDisponible(valor);
    return numero === null ? 'N/D' : `${(numero * 100).toFixed(1)}%`;
  }
  formatearDias(valor: number | null | undefined): string {
    const numero = this.numeroDisponible(valor);
    return numero === null ? 'N/D' : `${this.formatearNumero(numero, 2)} días`;
  }
  claseRiesgo(nivel?: string | null): string {
    return nivel ? `riesgo-${nivel.toLowerCase()}` : '';
  }

  clasePrioridad(prioridad: PrioridadGestion): string {
    return `prioridad-${prioridad.toLowerCase().replace(/\s+/g, '-')}`;
  }

  private construirAccionesSugeridas(registro: DashboardDetalle | null): AccionGestion[] {
    if (!registro) return [];
    const ocupacion = this.numeroDisponible(registro.ocupacionEstimada);
    const estancia = this.numeroDisponible(registro.promedioEstancia);
    const ingresos = this.numeroDisponible(registro.ingresos);
    const egresos = this.numeroDisponible(registro.egresos);
    const balance = ingresos === null || egresos === null ? null : ingresos - egresos;
    const presion = this.numeroDisponible(registro.presionIngresosCamas);
    const diasCamaDisponibles = this.numeroDisponible(registro.totalCamasDisponibles);
    const mediaEstancia = this.mediaReal(this.datosTendencia.map(item => item.promedioEstancia));
    const mediaPresion = this.mediaReal(this.datosActividad.map(item => item.presionIngresosCamas));

    return [
      {
        indicador: 'Porcentaje de ocupación',
        valor: ocupacion === null ? 'N/D' : this.formatearPorcentaje(ocupacion),
        prioridad: ocupacion === null ? 'NO EVALUABLE' : ocupacion > .90 ? 'ALTA' : ocupacion >= .85 ? 'MEDIA' : 'BAJA',
        interpretacion: ocupacion === null
          ? 'No hay un valor disponible para interpretar la ocupación observada del periodo.'
          : ocupacion > .90
            ? 'La ocupación observada del periodo supera el umbral operacional de alta presión utilizado en el proyecto.'
            : 'La ocupación observada del periodo no supera el umbral operacional de alta presión utilizado en el proyecto.',
        accion: 'Revisar disponibilidad registrada, tendencia reciente y comportamiento del servicio para priorizar su seguimiento.',
        responsable: 'Atención de Hospitalización / Gestión de Camas'
      },
      {
        indicador: 'Promedio de estancia', valor: estancia === null ? 'N/D' : `${this.formatearNumero(estancia, 2)} días`,
        prioridad: estancia === null ? 'NO EVALUABLE' : this.prioridadRelativa(estancia, mediaEstancia),
        interpretacion: 'Una permanencia promedio elevada puede asociarse con menor rotación de camas y requiere revisión del comportamiento del servicio.',
        accion: 'Revisar casos con permanencias prolongadas junto con el equipo asistencial responsable, sin sugerir altas automáticas.',
        responsable: 'Atención de Hospitalización'
      },
      {
        indicador: 'Balance ingresos-egresos', valor: balance === null ? 'N/D' : this.formatearNumero(balance),
        prioridad: balance === null ? 'NO EVALUABLE' : balance > 0 ? 'MEDIA' : 'BAJA',
        interpretacion: balance !== null && balance > 0
          ? 'Los ingresos registrados superan los egresos del periodo.'
          : balance !== null && balance < 0
            ? 'Los egresos registrados superan los ingresos del periodo.'
            : balance === 0
              ? 'Los ingresos y egresos presentan un comportamiento equilibrado.'
              : 'No hay datos suficientes para interpretar el balance del periodo.',
        accion: 'Revisar la evolución mensual de ingresos y egresos registrados.',
        responsable: 'Admisión y Registros Médicos'
      },
      {
        indicador: 'Presión ingresos/camas', valor: presion === null ? 'N/D' : this.formatearNumero(presion, 2),
        prioridad: presion === null ? 'NO EVALUABLE' : this.prioridadRelativa(presion, mediaPresion),
        interpretacion: 'Representa la relación entre los ingresos hospitalarios y las camas registradas durante el periodo.',
        accion: 'Priorizar el seguimiento de servicios con mayor presión y revisar su tendencia reciente.',
        responsable: 'Atención de Hospitalización / Gestión de Camas'
      },
      {
        indicador: 'Días-cama disponibles',
        valor: diasCamaDisponibles === null ? 'N/D' : this.formatearNumero(diasCamaDisponibles),
        prioridad: diasCamaDisponibles === null ? 'NO EVALUABLE' : diasCamaDisponibles <= 0 ? 'ALTA' : 'BAJA',
        interpretacion: 'Representa la capacidad mensual registrada en días-cama disponibles para el servicio y periodo analizado.',
        accion: 'Verificar la consistencia de la capacidad mensual registrada y considerarla junto con la ocupación y la presión ingresos/camas para la revisión del servicio.',
        responsable: 'Admisión / Atención de Hospitalización'
      }
    ];
  }

  private prioridadRelativa(valor: number, referencia: number): PrioridadGestion {
    if (referencia <= 0 || valor <= referencia) return 'BAJA';
    return valor >= referencia * 1.25 ? 'ALTA' : 'MEDIA';
  }

  private mediaReal(valores: Array<number | null | undefined>): number {
    const validos = valores.map(valor => this.numeroDisponible(valor)).filter((valor): valor is number => valor !== null);
    return validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : 0;
  }

  private numeroDisponible(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  private establecerDatosVisualesBase(detalle: DashboardDetalle[]): void {
    const base = detalle[0];
    if (!base) {
      this.datosActividad = [];
      this.datosTendencia = [];
      return;
    }
    this.datosActividad = detalle.filter(item => item.anio === base.anio && item.mes === base.mes);
    this.datosTendencia = detalle.filter(item =>
      item.anio === base.anio && item.servicioHospitalario === base.servicioHospitalario
    );
  }

  private sumar(campo: keyof DashboardDetalle): number {
    return this.detalle.reduce((a, d) => a + (Number(d[campo]) || 0), 0);
  }
  private promedio(campo: keyof DashboardDetalle): number | null {
    const valores = this.detalle
      .map(d => this.numeroDisponible(d[campo]))
      .filter((valor): valor is number => valor !== null);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
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
