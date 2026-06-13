import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { DashboardDetalle } from '../../models/dashboard-detalle';
import { DashboardResumen } from '../../models/dashboard-resumen';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

interface DetalleConCapacidad extends DashboardDetalle {
  totalCamasDisponibles?: number | null;
}

interface ServicioIngreso {
  nombre: string;
  ingresos: number;
  altura: number;
}

interface PuntoOcupacion {
  etiqueta: string;
  valor: number;
  x: number;
  y: number;
}

interface GuiaOcupacion {
  valor: number;
  y: number;
}

interface VariableInfluyente {
  nombre: string;
  valor: string;
  tendencia: 'sube' | 'baja' | 'estable';
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
  private detalleCatalogo: DashboardDetalle[] = [];

  anioFiltro: number | null = null;
  mesFiltro: number | null = null;
  servicioFiltro = '';

  readonly meses = [
    { valor: 1, nombre: 'Enero', corto: 'Ene' },
    { valor: 2, nombre: 'Febrero', corto: 'Feb' },
    { valor: 3, nombre: 'Marzo', corto: 'Mar' },
    { valor: 4, nombre: 'Abril', corto: 'Abr' },
    { valor: 5, nombre: 'Mayo', corto: 'May' },
    { valor: 6, nombre: 'Junio', corto: 'Jun' },
    { valor: 7, nombre: 'Julio', corto: 'Jul' },
    { valor: 8, nombre: 'Agosto', corto: 'Ago' },
    { valor: 9, nombre: 'Septiembre', corto: 'Sep' },
    { valor: 10, nombre: 'Octubre', corto: 'Oct' },
    { valor: 11, nombre: 'Noviembre', corto: 'Nov' },
    { valor: 12, nombre: 'Diciembre', corto: 'Dic' }
  ];

  cargando = false;
  error = '';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

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
        this.detalleCatalogo = data.detalle;
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

    this.dashboardService.filtrar(
      this.anioFiltro ?? undefined,
      this.mesFiltro ?? undefined,
      this.servicioFiltro.trim() || undefined
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

  limpiarFiltros(): void {
    this.cargarDashboard();
  }

  get ipressAsignada(): string {
    const usuario = this.authService.obtenerUsuarioActual();
    return usuario?.ipressAsignada || usuario?.nombreIpress || 'IPRESS no asignada';
  }

  get aniosDisponibles(): number[] {
    return [...new Set(this.detalleCatalogo.map((item) => item.anio))]
      .filter((anio) => Number.isFinite(anio))
      .sort((a, b) => b - a);
  }

  get serviciosDisponibles(): string[] {
    return [...new Set(
      this.detalleCatalogo
        .map((item) => item.servicioHospitalario?.trim())
        .filter((servicio): servicio is string => Boolean(servicio))
    )].sort((a, b) => a.localeCompare(b));
  }

  get registroCritico(): DashboardDetalle | null {
    if (this.detalle.length === 0) {
      return null;
    }

    return [...this.detalle].sort((a, b) => {
      const probabilidad = this.porcentajeNumerico(b.probabilidad)
        - this.porcentajeNumerico(a.probabilidad);
      return probabilidad || this.puntajeRiesgo(b.nivelRiesgo)
        - this.puntajeRiesgo(a.nivelRiesgo);
    })[0];
  }

  get probabilidadCritica(): number {
    return Math.min(
      Math.max(this.porcentajeNumerico(this.registroCritico?.probabilidad), 0),
      100
    );
  }

  get totalIngresos(): number {
    return this.sumar(this.detalle.map((item) => item.ingresos));
  }

  get totalEgresos(): number {
    return this.sumar(this.detalle.map((item) => item.egresos));
  }

  get totalEstancias(): number {
    return this.sumar(this.detalle.map((item) => item.estancias));
  }

  get totalPacientesCama(): number {
    return this.sumar(this.detalle.map((item) => item.pacientesCama));
  }

  get totalCamas(): number {
    return this.sumar(this.detalle.map((item) => item.camasTotales));
  }

  get capacidadRegistrada(): number {
    return this.sumar(this.detalle.map((item) => this.obtenerCapacidad(item)));
  }

  get usaCapacidadMensual(): boolean {
    return this.detalle.some((item) => {
      const detalle = item as DetalleConCapacidad;
      return detalle.totalCamasDisponibles !== null
        && detalle.totalCamasDisponibles !== undefined
        && detalle.totalCamasDisponibles > 0;
    });
  }

  get ocupacionPromedio(): number {
    return this.promedio(this.detalle.map((item) => item.ocupacionEstimada));
  }

  get presionPromedio(): number {
    return this.promedio(this.detalle.map((item) => item.presionIngresosCamas));
  }

  get topServicios(): ServicioIngreso[] {
    const acumulado = new Map<string, number>();

    this.detalle.forEach((item) => {
      const servicio = item.servicioHospitalario?.trim() || 'Sin servicio';
      acumulado.set(servicio, (acumulado.get(servicio) ?? 0) + (item.ingresos ?? 0));
    });

    const servicios = [...acumulado.entries()]
      .map(([nombre, ingresos]) => ({ nombre, ingresos }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 6);
    const maximo = Math.max(...servicios.map((item) => item.ingresos), 1);

    return servicios.map((item) => ({
      ...item,
      altura: Math.max((item.ingresos / maximo) * 100, 4)
    }));
  }

  get puntosOcupacion(): PuntoOcupacion[] {
    const serie = this.construirSerieOcupacion();
    const maximo = this.escalaOcupacionMax;
    const inicioX = 42;
    const ancho = 524;
    const baseY = 176;
    const alto = 148;

    return serie.map((item, indice) => ({
      etiqueta: `${this.nombreMesCorto(item.mes)} ${String(item.anio).slice(-2)}`,
      valor: item.valor,
      x: serie.length === 1
        ? inicioX + ancho / 2
        : inicioX + (indice * ancho) / (serie.length - 1),
      y: baseY - (item.valor / maximo) * alto
    }));
  }

  get trazadoOcupacion(): string {
    return this.puntosOcupacion
      .map((punto) => `${punto.x},${punto.y}`)
      .join(' ');
  }

  get guiasOcupacion(): GuiaOcupacion[] {
    const maximo = this.escalaOcupacionMax;
    return [0, 1, 2, 3, 4].map((indice) => ({
      valor: maximo - (maximo * indice) / 4,
      y: 28 + indice * 37
    }));
  }

  get alertasDestacadas(): DashboardDetalle[] {
    const fuente = this.alertas.length > 0
      ? this.alertas
      : this.detalle.filter((item) => this.puntajeRiesgo(item.nivelRiesgo) >= 2);

    return [...fuente]
      .sort((a, b) => {
        const riesgo = this.puntajeRiesgo(b.nivelRiesgo)
          - this.puntajeRiesgo(a.nivelRiesgo);
        return riesgo || this.porcentajeNumerico(b.probabilidad)
          - this.porcentajeNumerico(a.probabilidad);
      })
      .slice(0, 3);
  }

  get variablesInfluyentes(): VariableInfluyente[] {
    const registro = this.registroCritico;
    if (!registro) {
      return [];
    }

    return [
      {
        nombre: 'Ingresos hospitalarios',
        valor: this.formatearNumero(registro.ingresos),
        tendencia: 'sube'
      },
      {
        nombre: 'Ocupación estimada',
        valor: this.formatearPorcentaje(registro.ocupacionEstimada),
        tendencia: this.porcentajeNumerico(registro.ocupacionEstimada) >= 85
          ? 'sube'
          : 'estable'
      },
      {
        nombre: 'Pacientes-cama',
        valor: this.formatearNumero(registro.pacientesCama, 1),
        tendencia: 'sube'
      },
      {
        nombre: 'Promedio de estancia',
        valor: this.formatearNumero(registro.promedioEstancia, 2),
        tendencia: registro.promedioEstancia > 7 ? 'sube' : 'baja'
      },
      {
        nombre: 'Presión ingresos/camas',
        valor: this.formatearNumero(registro.presionIngresosCamas, 2),
        tendencia: registro.presionIngresosCamas > 1 ? 'sube' : 'estable'
      },
      {
        nombre: this.usaCapacidadMensual
          ? 'Camas-día disponibles'
          : 'Camas disponibles',
        valor: this.formatearNumero(this.obtenerCapacidad(registro)),
        tendencia: 'estable'
      }
    ];
  }

  get tablaResumen(): DashboardDetalle[] {
    return [...this.detalle]
      .sort((a, b) => {
        const periodo = b.anio - a.anio || b.mes - a.mes;
        return periodo || this.porcentajeNumerico(b.probabilidad)
          - this.porcentajeNumerico(a.probabilidad);
      })
      .slice(0, 12);
  }

  get ultimaActualizacion(): string {
    const fecha = this.registroCritico?.fechaPrediccion;
    if (!fecha) {
      return 'Sin datos recientes';
    }

    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) {
      return fecha;
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(valor);
  }

  obtenerCapacidad(item: DashboardDetalle): number {
    const detalle = item as DetalleConCapacidad;
    if (detalle.totalCamasDisponibles !== null
        && detalle.totalCamasDisponibles !== undefined
        && detalle.totalCamasDisponibles > 0) {
      return detalle.totalCamasDisponibles;
    }

    return item.camasDisponiblesHabilitadas ?? 0;
  }

  obtenerClaseRiesgo(nivelRiesgo: string | null | undefined): string {
    const riesgo = nivelRiesgo?.toUpperCase();
    if (riesgo === 'ALTO') {
      return 'riesgo-alto';
    }
    if (riesgo === 'MEDIO') {
      return 'riesgo-medio';
    }
    return 'riesgo-bajo';
  }

  obtenerMensajeAlerta(item: DashboardDetalle): string {
    if (item.alerta?.trim()) {
      return item.alerta;
    }

    return `${this.formatearPorcentaje(item.ocupacionEstimada)} de ocupación y `
      + `${this.formatearNumero(item.presionIngresosCamas, 2)} de presión ingresos/camas.`;
  }

  formatearPorcentaje(valor: number | null | undefined): string {
    return `${this.porcentajeNumerico(valor).toFixed(1)}%`;
  }

  formatearNumero(
    valor: number | null | undefined,
    decimales = 0
  ): string {
    return new Intl.NumberFormat('es-PE', {
      maximumFractionDigits: decimales,
      minimumFractionDigits: 0
    }).format(valor ?? 0);
  }

  private get escalaOcupacionMax(): number {
    const valores = this.construirSerieOcupacion().map((item) => item.valor);
    const maximo = Math.max(...valores, 100);
    return Math.ceil(maximo / 25) * 25;
  }

  private construirSerieOcupacion(): Array<{ anio: number; mes: number; valor: number }> {
    const grupos = new Map<string, {
      anio: number;
      mes: number;
      valores: number[];
    }>();

    this.detalle.forEach((item) => {
      const clave = `${item.anio}-${item.mes}`;
      const grupo = grupos.get(clave) ?? {
        anio: item.anio,
        mes: item.mes,
        valores: []
      };
      grupo.valores.push(this.porcentajeNumerico(item.ocupacionEstimada));
      grupos.set(clave, grupo);
    });

    return [...grupos.values()]
      .map((grupo) => ({
        anio: grupo.anio,
        mes: grupo.mes,
        valor: this.promedio(grupo.valores)
      }))
      .sort((a, b) => a.anio - b.anio || a.mes - b.mes)
      .slice(-8);
  }

  private nombreMesCorto(mes: number): string {
    return this.meses.find((item) => item.valor === mes)?.corto ?? String(mes);
  }

  private porcentajeNumerico(valor: number | null | undefined): number {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) {
      return 0;
    }
    return valor <= 1 ? valor * 100 : valor;
  }

  private puntajeRiesgo(nivelRiesgo: string | null | undefined): number {
    const riesgo = nivelRiesgo?.toUpperCase();
    if (riesgo === 'ALTO') {
      return 3;
    }
    if (riesgo === 'MEDIO') {
      return 2;
    }
    if (riesgo === 'BAJO') {
      return 1;
    }
    return 0;
  }

  private construirResumenDesdeDetalle(data: DashboardDetalle[]): DashboardResumen {
    const totalRiesgoAlto = data.filter(
      (item) => item.nivelRiesgo?.toUpperCase() === 'ALTO'
    ).length;
    const totalRiesgoMedio = data.filter(
      (item) => item.nivelRiesgo?.toUpperCase() === 'MEDIO'
    ).length;
    const totalRiesgoBajo = data.filter(
      (item) => item.nivelRiesgo?.toUpperCase() === 'BAJO'
    ).length;
    const nivelRiesgoPredominante = this.obtenerRiesgoPredominante(
      totalRiesgoBajo,
      totalRiesgoMedio,
      totalRiesgoAlto
    );

    return {
      totalPredicciones: data.length,
      totalRiesgoBajo,
      totalRiesgoMedio,
      totalRiesgoAlto,
      promedioOcupacionEstimada: this.promedio(
        data.map((item) => item.ocupacionEstimada)
      ),
      promedioPresionIngresosCamas: this.promedio(
        data.map((item) => item.presionIngresosCamas)
      ),
      promedioProbabilidad: this.promedio(data.map((item) => item.probabilidad)),
      totalIngresos: this.sumar(data.map((item) => item.ingresos)),
      totalEgresos: this.sumar(data.map((item) => item.egresos)),
      totalEstancias: this.sumar(data.map((item) => item.estancias)),
      totalPacientesCama: this.sumar(data.map((item) => item.pacientesCama)),
      totalCamasDisponiblesHabilitadas: this.sumar(
        data.map((item) => item.camasDisponiblesHabilitadas)
      ),
      nivelRiesgoPredominante,
      mensajeResumen: data.length === 0
        ? 'No existen registros para los filtros seleccionados.'
        : `Predomina el nivel de riesgo ${nivelRiesgoPredominante.toLowerCase()}.`
    };
  }

  private promedio(valores: Array<number | null | undefined>): number {
    const validos = valores.filter(
      (valor): valor is number => valor !== null
        && valor !== undefined
        && Number.isFinite(valor)
    );
    if (validos.length === 0) {
      return 0;
    }
    return validos.reduce((acc, valor) => acc + valor, 0) / validos.length;
  }

  private sumar(valores: Array<number | null | undefined>): number {
    return valores
      .filter((valor): valor is number => valor !== null
        && valor !== undefined
        && Number.isFinite(valor)
      )
      .reduce((acc, valor) => acc + valor, 0);
  }

  private obtenerRiesgoPredominante(
    bajo: number,
    medio: number,
    alto: number
  ): string {
    if (alto >= medio && alto >= bajo && alto > 0) {
      return 'ALTO';
    }
    if (medio >= alto && medio >= bajo && medio > 0) {
      return 'MEDIO';
    }
    return bajo > 0 ? 'BAJO' : 'SIN DATOS';
  }
}
