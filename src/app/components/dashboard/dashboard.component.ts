import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { ArchivoProcesado } from '../../models/archivo-procesado';
import { DashboardDetalle } from '../../models/dashboard-detalle';
import { DashboardResumen } from '../../models/dashboard-resumen';
import { ArchivoService } from '../../services/archivo.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

type SeleccionArchivo = 'TODOS' | 'ULTIMO' | number;

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

interface IndicadorExplicado {
  nombre: string;
  descripcion: string;
}

interface DatoResultado {
  nombre: string;
  valor: string;
  descripcion: string;
}

interface SenalObservada {
  nombre: string;
  descripcion: string;
  tipo: 'alto' | 'medio' | 'bajo';
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

  idArchivoFiltro: number | null = null;
  seleccionArchivo: SeleccionArchivo = 'TODOS';
  archivosProcesados: ArchivoProcesado[] = [];
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

  readonly indicadoresExplicados: IndicadorExplicado[] = [
    {
      nombre: 'Ocupación estimada',
      descripcion: 'Pacientes-cama dividido entre la capacidad mensual registrada. Se muestra como porcentaje: 1.4 equivale a 140%.'
    },
    {
      nombre: 'Presión ingresos/camas',
      descripcion: 'Relaciona los ingresos hospitalarios con las camas informadas para detectar presión de demanda.'
    },
    {
      nombre: 'Camas-día disponibles',
      descripcion: 'Capacidad mensual registrada. Cuando viene informada como camas-día disponibles, se muestra sin recalcularla.'
    },
    {
      nombre: 'Promedio de estancia',
      descripcion: 'Estancias divididas entre egresos. Ayuda a detectar uso prolongado de camas.'
    }
  ];

  cargando = false;
  error = '';

  constructor(
    private dashboardService: DashboardService,
    private archivoService: ArchivoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

cargarDashboard(): void {
  this.anioFiltro = null;
  this.mesFiltro = null;
  this.servicioFiltro = '';
  this.idArchivoFiltro = null;
  this.seleccionArchivo = 'TODOS';
  this.cargando = true;
  this.error = '';

  forkJoin({
    resumen: this.dashboardService.obtenerResumen(),
    detalle: this.dashboardService.obtenerDetalle(),
    alertas: this.dashboardService.obtenerAlertas(),
    archivos: this.archivoService.listarArchivosProcesados().pipe(
      catchError((error) => {
        console.error('Error al cargar archivos procesados:', error);
        return of([] as ArchivoProcesado[]);
      })
    )
  }).subscribe({
    next: (data) => {
      this.resumen = data.resumen;
      this.detalle = data.detalle;
      this.detalleCatalogo = data.detalle;
      this.alertas = data.alertas;
      this.archivosProcesados = data.archivos;

      this.aplicarUltimoArchivoPorDefecto();

      this.cargando = false;
    },
    error: (error) => {
      console.error('Error al cargar dashboard:', error);
      this.error = 'No se pudo cargar el dashboard. Verifica que el backend esté activo.';
      this.cargando = false;
    }
  });
}
private aplicarUltimoArchivoPorDefecto(): void {
  const ultimo = this.ultimoArchivoProcesado;

  if (!ultimo) {
    this.seleccionArchivo = 'TODOS';
    this.idArchivoFiltro = null;
    this.detalle = this.detalleCatalogo;
    this.alertas = this.detalleCatalogo.filter((item) => {
      const riesgo = item.nivelRiesgo?.toUpperCase();
      return riesgo === 'MEDIO' || riesgo === 'ALTO';
    });
    this.resumen = this.construirResumenDesdeDetalle(this.detalleCatalogo);
    return;
  }

  this.seleccionArchivo = 'ULTIMO';
  this.idArchivoFiltro = ultimo.idArchivo;

  const detalleUltimoArchivo = this.detalleCatalogo.filter(
    (item) => item.idArchivo === ultimo.idArchivo
  );

  this.detalle = detalleUltimoArchivo;

  this.alertas = detalleUltimoArchivo.filter((item) => {
    const riesgo = item.nivelRiesgo?.toUpperCase();
    return riesgo === 'MEDIO' || riesgo === 'ALTO';
  });

  this.resumen = this.construirResumenDesdeDetalle(detalleUltimoArchivo);
}

  filtrarDashboard(): void {
    this.cargando = true;
    this.error = '';

    this.dashboardService.filtrar(
      this.idArchivoFiltro ?? undefined,
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

  cambiarArchivoSeleccionado(): void {
    if (this.seleccionArchivo === 'TODOS') {
      this.idArchivoFiltro = null;
      return;
    }

    if (this.seleccionArchivo === 'ULTIMO') {
      this.idArchivoFiltro = this.ultimoArchivoProcesado?.idArchivo ?? null;
      return;
    }

    this.idArchivoFiltro = this.seleccionArchivo;
  }

  get ultimoArchivoProcesado(): ArchivoProcesado | null {
    return this.archivosProcesados[0] ?? null;
  }

  get archivoSeleccionadoNombre(): string {
    if (this.seleccionArchivo === 'TODOS') {
      return 'Todos los archivos disponibles';
    }

    const archivo = this.archivosProcesados.find(
      (item) => item.idArchivo === this.idArchivoFiltro
    );
    return archivo?.nombreArchivo
      ?? this.registroCritico?.nombreArchivo
      ?? 'Sin archivo';
  }

  get etiquetaArchivoSeleccionado(): string {
    if (this.seleccionArchivo === 'TODOS') {
      return 'Vista actual';
    }

    if (this.seleccionArchivo === 'ULTIMO') {
      return 'Último archivo procesado';
    }

    return 'Archivo procesado';
  }

  get ipressAsignada(): string {
    const usuario = this.authService.obtenerUsuarioActual();
    return usuario?.ipressAsignada || usuario?.nombreIpress || 'IPRESS no asignada';
  }

  get aniosDisponibles(): number[] {
    return [...new Set(this.catalogoSegunArchivo.map((item) => item.anio))]
      .filter((anio) => Number.isFinite(anio))
      .sort((a, b) => b - a);
  }

  get serviciosDisponibles(): string[] {
    return [...new Set(
      this.catalogoSegunArchivo
        .map((item) => item.servicioHospitalario?.trim())
        .filter((servicio): servicio is string => Boolean(servicio))
    )].sort((a, b) => a.localeCompare(b));
  }

  get registroCritico(): DashboardDetalle | null {
    if (this.detalle.length === 0) {
      return null;
    }

    return [...this.detalle].sort((a, b) => {
      const riesgo = this.puntajeRiesgo(b.nivelRiesgo)
        - this.puntajeRiesgo(a.nivelRiesgo);

      const probabilidad = this.porcentajeNumerico(b.probabilidad)
        - this.porcentajeNumerico(a.probabilidad);

      return riesgo || probabilidad;
    })[0];
  }

get probabilidadCritica(): number {
  return this.porcentajeNumerico(this.riesgoInsuficienciaCapacidad);
}

get riesgoInsuficienciaCapacidad(): number {
  const registro = this.registroCritico;

  if (!registro) {
    return 0;
  }

  if (
    registro.riesgoInsuficienciaCapacidad !== null &&
    registro.riesgoInsuficienciaCapacidad !== undefined
  ) {
    return registro.riesgoInsuficienciaCapacidad;
  }

  return this.calcularRiesgoVisualFallback(registro);
}

private calcularRiesgoVisualFallback(registro: DashboardDetalle): number {
  const riesgo = registro.nivelRiesgo?.toUpperCase();
  const confianza = this.porcentajeNumerico(registro.probabilidad) / 100;

  if (riesgo === 'BAJO') {
    return (1 - confianza) * 0.33;
  }

  if (riesgo === 'MEDIO') {
    return 0.33 + confianza * 0.33;
  }

  if (riesgo === 'ALTO') {
    return 0.66 + confianza * 0.34;
  }

  return 0;
}

private obtenerPorcentajeRiesgoAlto(): number {
  const registro = this.registroCritico;

  if (!registro) {
    return 0;
  }

  if (
    registro.probabilidadRiesgoAlto !== null &&
    registro.probabilidadRiesgoAlto !== undefined
  ) {
    return registro.probabilidadRiesgoAlto;
  }

  if (registro.nivelRiesgo?.toUpperCase() === 'ALTO') {
    return registro.probabilidad;
  }

  return 0;
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
      return item.totalCamasDisponibles !== null
        && item.totalCamasDisponibles !== undefined
        && item.totalCamasDisponibles > 0;
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
        valor: this.formatearOcupacion(registro.ocupacionEstimada),
        tendencia: this.porcentajeOcupacionNumerico(registro.ocupacionEstimada) >= 85
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

  get interpretacionRiesgo(): string {
    const riesgo = this.registroCritico?.nivelRiesgo?.toUpperCase();

    if (riesgo === 'ALTO') {
      return 'Existe posible insuficiencia de capacidad asistencial para el siguiente mes.';
    }

    if (riesgo === 'MEDIO') {
      return 'Existen señales de presión hospitalaria que requieren revisión.';
    }

    if (riesgo === 'BAJO') {
      return 'La capacidad parece estable frente a la demanda esperada.';
    }

    return 'Sin riesgo predicho disponible para el registro actual.';
  }

  get factoresExplicativos(): string[] {
    const registro = this.registroCritico;
    if (!registro) {
      return [];
    }

    const factores: string[] = [];
    const ocupacion = this.porcentajeOcupacionNumerico(registro.ocupacionEstimada);
    const capacidad = this.obtenerCapacidad(registro);

    if (ocupacion >= 100) {
      factores.push('El uso acumulado de camas supera la capacidad mensual registrada.');
    } else if (ocupacion >= 85) {
      factores.push('La ocupación estimada supera el umbral de presión alta.');
    } else if (ocupacion >= 70) {
      factores.push('La ocupación estimada muestra presión moderada.');
    } else {
      factores.push('La ocupación estimada se mantiene en un rango bajo o estable.');
    }

    if ((registro.pacientesCama ?? 0) > capacidad && capacidad > 0) {
      factores.push('Los pacientes-cama superan las camas-día disponibles del mes.');
    }

    if ((registro.promedioEstancia ?? 0) > 7) {
      factores.push('Las estancias hospitalarias reflejan uso prolongado de camas.');
    }

    if ((registro.presionIngresosCamas ?? 0) >= 1) {
      factores.push('La presión ingresos/camas indica alta demanda frente a la capacidad registrada.');
    }

    factores.push('El modelo también considera comportamiento histórico, tendencias y características del servicio.');
    return factores;
  }

  get servicioPrioritario(): DashboardDetalle | null {
    return this.registroCritico;
  }

  get brechaOperativa(): number {
    return this.calcularBrechaOperativa(this.servicioPrioritario);
  }

  get nivelBrechaOperativaActual(): string {
    return this.nivelBrechaOperativa(this.brechaOperativa);
  }

  get diagnosticoOperativoActual(): string {
    return this.diagnosticoOperativo(this.servicioPrioritario);
  }

  get lecturaResultado(): string[] {
    const registro = this.servicioPrioritario;
    if (!registro) {
      return [
        'No hay registros hospitalarios procesados para interpretar con los filtros seleccionados.'
      ];
    }

    const servicio = registro.servicioHospitalario || 'hospitalización';
    const riesgo = (registro.nivelRiesgo || 'SIN DATOS').toUpperCase();
    const confianza = this.formatearPorcentaje(
      registro.confianzaPrediccion ?? registro.probabilidad
    );
    const ingresos = this.formatearNumero(registro.ingresos);
    const egresos = this.formatearNumero(registro.egresos);
    const pacientesCama = this.formatearNumero(registro.pacientesCama, 1);
    const estancia = this.formatearNumero(registro.promedioEstancia, 2);
    const ocupacion = this.formatearOcupacion(registro.ocupacionEstimada);
    const presion = this.formatearNumero(registro.presionIngresosCamas, 2);

    return [
      `Para el siguiente mes, el servicio de ${servicio} presenta riesgo ${riesgo} con una confianza de ${confianza}. Esto significa que, si el comportamiento observado se mantiene, ese servicio podría tener más presión para atender nuevos pacientes con la capacidad disponible. ${this.mensajeSimplePorRiesgo(riesgo)}`,
      `En el periodo base se registraron ${ingresos} ingresos y ${egresos} egresos. Los ingresos son pacientes que entran al servicio y los egresos son pacientes que salen por alta, traslado, fallecimiento u otro cierre de atención. ${this.mensajeSimpleBalance(registro)}`,
      `También se registraron ${pacientesCama} pacientes-cama. Este indicador refleja el uso acumulado de camas durante el mes: mientras más alto sea, mayor fue la carga asistencial. Además, la estancia promedio fue de ${estancia} días, es decir, en promedio los pacientes permanecieron ese tiempo en el servicio. ${this.mensajeSimpleEstancia(registro)}`,
      `La ocupación estimada fue ${ocupacion} y muestra qué tanto se usó la capacidad disponible. ${this.mensajeSimpleOcupacion(registro)} La presión ingresos/camas fue ${presion}; este indicador compara cuántos ingresos hubo frente a la capacidad registrada. ${this.mensajeSimplePresion(registro)}`,
      'Este resultado no significa que el sistema asigne camas, decida altas o reemplace al personal de salud. Sirve como apoyo para que el usuario revise el servicio con mayor presión, observe si entran más pacientes de los que salen, verifique la información de camas disponibles o habilitadas y coordine la revisión de alertas con las áreas correspondientes.'
    ];
  }

  get datosResultado(): DatoResultado[] {
    const registro = this.servicioPrioritario;
    if (!registro) {
      return [];
    }

    return [
      {
        nombre: 'Ingresos',
        valor: this.formatearNumero(registro.ingresos),
        descripcion: 'Pacientes que entraron al servicio.'
      },
      {
        nombre: 'Egresos',
        valor: this.formatearNumero(registro.egresos),
        descripcion: 'Pacientes que salieron del servicio.'
      },
      {
        nombre: 'Balance',
        valor: this.formatearNumero(this.balanceIngresosEgresos(registro)),
        descripcion: 'Diferencia entre ingresos y egresos.'
      },
      {
        nombre: 'Pacientes-cama',
        valor: this.formatearNumero(registro.pacientesCama, 1),
        descripcion: 'Uso acumulado de camas durante el mes.'
      },
      {
        nombre: 'Estancia promedio',
        valor: `${this.formatearNumero(registro.promedioEstancia, 2)} días`,
        descripcion: 'Días promedio que permanece un paciente.'
      },
      {
        nombre: 'Ocupación estimada',
        valor: this.formatearOcupacion(registro.ocupacionEstimada),
        descripcion: 'Nivel de uso de la capacidad.'
      },
      {
        nombre: 'Presión ingresos/camas',
        valor: this.formatearNumero(registro.presionIngresosCamas, 2),
        descripcion: 'Relación entre demanda y camas registradas.'
      },
      {
        nombre: 'Camas disponibles/capacidad registrada',
        valor: this.formatearNumero(this.obtenerCapacidad(registro)),
        descripcion: 'Capacidad informada para el periodo.'
      }
    ];
  }

  get senalesObservadas(): SenalObservada[] {
    const registro = this.servicioPrioritario;
    if (!registro) {
      return [];
    }

    const senales: SenalObservada[] = [];
    if (this.porcentajeOcupacionNumerico(registro.ocupacionEstimada) >= 90) {
      senales.push({
        nombre: 'Ocupación crítica',
        descripcion: 'La capacidad estuvo muy utilizada y queda poco margen para nuevos ingresos.',
        tipo: 'alto'
      });
    }
    if (this.balanceIngresosEgresos(registro) > 0) {
      senales.push({
        nombre: 'Ingresos mayores que egresos',
        descripcion: 'Entraron más pacientes de los que salieron durante el periodo base.',
        tipo: 'medio'
      });
    }
    if ((registro.promedioEstancia || 0) > 7) {
      senales.push({
        nombre: 'Estancia prolongada',
        descripcion: 'Los pacientes permanecieron más días y las camas tardaron más en liberarse.',
        tipo: 'medio'
      });
    }
    if ((registro.presionIngresosCamas || 0) > 1) {
      senales.push({
        nombre: 'Alta presión ingresos/camas',
        descripcion: 'La demanda fue alta frente a la capacidad registrada.',
        tipo: 'alto'
      });
    }
    if (this.ratioCamasDisponibles(registro) <= 0.10) {
      senales.push({
        nombre: 'Capacidad disponible limitada',
        descripcion: 'La capacidad informada para el periodo fue baja frente a la referencia de camas.',
        tipo: 'alto'
      });
    }
    if (senales.length === 0) {
      senales.push({
        nombre: 'Riesgo controlado',
        descripcion: 'No se observan señales críticas en los indicadores principales, pero conviene mantener la revisión mensual.',
        tipo: 'bajo'
      });
    }

    return senales.slice(0, 4);
  }

  get recomendacionesGestion(): string[] {
    const registro = this.servicioPrioritario;
    if (!registro) {
      return [];
    }
    if (registro.recomendacionesOperativas?.length) {
      return registro.recomendacionesOperativas;
    }
    return this.recomendacionesPorCausa(this.causaPrincipalRiesgo(registro));
  }

  balanceIngresosEgresos(item: DashboardDetalle | null | undefined): number {
    return (item?.ingresos || 0) - (item?.egresos || 0);
  }

  relacionEgresosIngresos(item: DashboardDetalle | null | undefined): number {
    if (!item?.ingresos) {
      return 0;
    }
    return (item.egresos || 0) / item.ingresos;
  }

  margenOcupacion(item: DashboardDetalle | null | undefined): number {
    return 1 - (item?.ocupacionEstimada || 0);
  }

  calcularBrechaOperativa(item: DashboardDetalle | null | undefined): number {
    if (!item) {
      return 0;
    }
    if (item.brechaOperativa !== null && item.brechaOperativa !== undefined) {
      return item.brechaOperativa;
    }
    let puntaje = 0;
    if (this.puntajeRiesgo(item.nivelRiesgo) === 3) {
      puntaje += 30;
    } else if (this.puntajeRiesgo(item.nivelRiesgo) === 2) {
      puntaje += 15;
    }
    if ((item.ocupacionEstimada || 0) >= 0.90) {
      puntaje += 25;
    } else if ((item.ocupacionEstimada || 0) >= 0.80) {
      puntaje += 15;
    }
    if ((item.presionIngresosCamas || 0) > 1) {
      puntaje += 15;
    }
    if (this.balanceIngresosEgresos(item) > 0) {
      puntaje += 10;
    }
    if ((item.promedioEstancia || 0) > 7) {
      puntaje += 10;
    }
    if ((item.rotacionCamas || 0) < 1) {
      puntaje += 5;
    }
    if (this.ratioCamasDisponibles(item) <= 0.10) {
      puntaje += 10;
    }
    return Math.min(puntaje, 100);
  }

  nivelBrechaOperativa(valor: number): string {
    if (valor >= 70) {
      return 'Brecha crítica';
    }
    if (valor >= 40) {
      return 'Brecha en observación';
    }
    return 'Brecha controlada';
  }

  causaPrincipalRiesgo(item: DashboardDetalle | null | undefined): string {
    if (!item) {
      return 'Sin datos';
    }
    if (item.causaPrincipalRiesgo) {
      return item.causaPrincipalRiesgo;
    }
    if ((item.ocupacionEstimada || 0) >= 0.90) {
      return 'Ocupación crítica';
    }
    if (this.ratioCamasDisponibles(item) <= 0.10) {
      return 'Capacidad disponible limitada';
    }
    if (this.balanceIngresosEgresos(item) > 0) {
      return 'Demanda supera egresos';
    }
    if ((item.promedioEstancia || 0) > 7) {
      return 'Estancia prolongada';
    }
    if ((item.presionIngresosCamas || 0) > 1) {
      return 'Alta presión ingresos/camas';
    }
    if ((item.rotacionCamas || 0) < 1) {
      return 'Baja rotación de camas';
    }
    return 'Riesgo controlado';
  }

  diagnosticoOperativo(item: DashboardDetalle | null | undefined): string {
    if (!item) {
      return 'No hay servicio prioritario para diagnosticar.';
    }
    if (item.diagnosticoOperativo) {
      return item.diagnosticoOperativo;
    }
    return `Para el siguiente mes, el servicio evaluado presenta riesgo ${(item.nivelRiesgo || 'SIN DATOS').toUpperCase()} de insuficiencia de capacidad asistencial. La causa principal identificada es ${this.causaPrincipalRiesgo(item).toLowerCase()}. Esto indica que la demanda hospitalaria podría ejercer presión sobre la capacidad registrada si la tendencia continúa.`;
  }

  indicadorMasCritico(item: DashboardDetalle | null | undefined): string {
    if (!item) {
      return 'Sin datos';
    }
    const candidatos = [
      { nombre: 'Ocupación estimada', valor: this.porcentajeOcupacionNumerico(item.ocupacionEstimada) },
      { nombre: 'Presión ingresos/camas', valor: (item.presionIngresosCamas || 0) * 100 },
      { nombre: 'Balance ingresos-egresos', valor: Math.max(this.balanceIngresosEgresos(item), 0) * 5 },
      { nombre: 'Promedio de estancia', valor: (item.promedioEstancia || 0) * 10 }
    ];
    return candidatos.sort((a, b) => b.valor - a.valor)[0].nombre;
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
    if (item.totalCamasDisponibles !== null
        && item.totalCamasDisponibles !== undefined
        && item.totalCamasDisponibles > 0) {
      return item.totalCamasDisponibles;
    }

    return item.camasDisponiblesHabilitadas ?? 0;
  }

  obtenerMesPredicho(
    item: DashboardDetalle | null | undefined
  ): number | null {
    if (!item?.mes) {
      return null;
    }
    return item.mes === 12 ? 1 : item.mes + 1;
  }

  obtenerAnioPredicho(
    item: DashboardDetalle | null | undefined
  ): number | null {
    if (!item?.anio || !item?.mes) {
      return null;
    }
    return item.mes === 12 ? item.anio + 1 : item.anio;
  }

  formatearPeriodoBase(
    item: DashboardDetalle | null | undefined
  ): string {
    if (!item?.mes || !item?.anio) {
      return 'Sin periodo';
    }
    return `${this.nombreMes(item.mes)} ${item.anio}`;
  }

  formatearPeriodoPredicho(
    item: DashboardDetalle | null | undefined
  ): string {
    const mes = item?.mesPredicho ?? this.obtenerMesPredicho(item);
    const anio = item?.anioPredicho ?? this.obtenerAnioPredicho(item);

    if (!mes || !anio) {
      return 'Sin periodo';
    }
    return `${this.nombreMes(mes)} ${anio}`;
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
    if (this.puntajeRiesgo(item.nivelRiesgo) >= 2) {
      return `${item.servicioHospitalario}: riesgo ${item.nivelRiesgo} por `
        + `${this.causaPrincipalRiesgo(item).toLowerCase()}.`;
    }

    if (item.alerta?.trim()) {
      return item.alerta;
    }

    return `${this.formatearOcupacion(item.ocupacionEstimada)} de ocupación y `
      + `${this.formatearNumero(item.presionIngresosCamas, 2)} de presión ingresos/camas.`;
  }

  formatearOcupacion(valor: number | null | undefined): string {
    return `${this.porcentajeOcupacionNumerico(valor).toFixed(1)}%`;
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

  private mensajeSimplePorRiesgo(riesgo: string): string {
    if (riesgo === 'ALTO') {
      return 'Por eso, requiere revisión preferente.';
    }
    if (riesgo === 'MEDIO') {
      return 'Por eso, requiere revisión preventiva.';
    }
    if (riesgo === 'BAJO') {
      return 'El riesgo está controlado, pero debe observarse de forma mensual.';
    }
    return 'El nivel de riesgo debe revisarse junto con los datos del periodo.';
  }

  private mensajeSimpleBalance(item: DashboardDetalle): string {
    const balance = this.balanceIngresosEgresos(item);
    if (balance > 0) {
      return `En este caso, hubo ${this.formatearNumero(balance)} ingresos más que egresos, lo que indica que entraron más pacientes de los que salieron.`;
    }
    return 'En este caso, los egresos compensaron los ingresos, lo que indica que la salida de pacientes ayudó a liberar capacidad durante el periodo.';
  }

  private mensajeSimpleEstancia(item: DashboardDetalle): string {
    if ((item.promedioEstancia || 0) > 7) {
      return 'Cuando la estancia supera 7 días, las camas tardan más en liberarse.';
    }
    return 'Este valor ayuda a entender cuánto tiempo se mantiene ocupada una cama en promedio.';
  }

  private mensajeSimpleOcupacion(item: DashboardDetalle): string {
    if (this.porcentajeOcupacionNumerico(item.ocupacionEstimada) >= 90) {
      return 'Como fue igual o mayor a 90%, el servicio tuvo poco margen para recibir nuevos pacientes.';
    }
    return 'Este valor permite ver si todavía existía margen de capacidad durante el periodo.';
  }

  private mensajeSimplePresion(item: DashboardDetalle): string {
    if ((item.presionIngresosCamas || 0) > 1) {
      return 'Como fue mayor que 1, la demanda fue alta frente a las camas disponibles o habilitadas.';
    }
    return 'Cuando este valor no supera 1, la demanda observada fue más manejable frente a la capacidad registrada.';
  }

  private recomendacionesPorCausa(causa: string): string[] {
    if (causa === 'Ocupación crítica') {
      return [
        'Se recomienda revisar los servicios con riesgo medio o alto.',
        'Puede considerarse verificar la actualización de camas disponibles o habilitadas.',
        'Conviene observar la ocupación estimada y la presión ingresos/camas.'
      ];
    }
    if (causa === 'Demanda supera egresos') {
      return [
        'Se recomienda revisar la relación entre ingresos y egresos hospitalarios.',
        'Puede considerarse observar servicios con mayor diferencia ingresos-egresos.',
        'El resultado puede apoyar la coordinación hospitalaria correspondiente.'
      ];
    }
    if (causa === 'Estancia prolongada') {
      return [
        'Conviene observar servicios con estancia promedio prolongada.',
        'Se recomienda revisar el efecto de la estancia sobre la rotación de camas.',
        'El resultado puede apoyar la revisión de indicadores de demanda y capacidad.'
      ];
    }
    if (causa === 'Capacidad disponible limitada') {
      return [
        'Puede considerarse verificar la actualización de camas disponibles o habilitadas.',
        'Se recomienda revisar la capacidad mensual registrada.',
        'Conviene observar si la capacidad disponible se mantiene baja en el periodo.'
      ];
    }
    return [
      'Se recomienda revisar servicios con riesgo medio o alto.',
      'Puede considerarse verificar la actualización de camas disponibles o habilitadas.',
      'Conviene observar servicios con estancia promedio prolongada.'
    ];
  }

  private ratioCamasDisponibles(item: DashboardDetalle | null | undefined): number {
    if (!item || !item.camasTotales || item.camasTotales <= 0) {
      return 1;
    }
    const capacidadMensual = item.camasTotales * this.diasDelMes(item.anio, item.mes);
    if (capacidadMensual <= 0) {
      return 1;
    }
    return this.obtenerCapacidad(item) / capacidadMensual;
  }

  private diasDelMes(anio: number, mes: number): number {
    return new Date(anio, mes, 0).getDate();
  }

  private get escalaOcupacionMax(): number {
    const valores = this.construirSerieOcupacion().map((item) => item.valor);
    const maximo = Math.max(...valores, 100);
    return Math.ceil(maximo / 25) * 25;
  }

  private get catalogoSegunArchivo(): DashboardDetalle[] {
    if (this.idArchivoFiltro === null) {
      return this.detalleCatalogo;
    }
    return this.detalleCatalogo.filter(
      (item) => item.idArchivo === this.idArchivoFiltro
    );
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
      grupo.valores.push(this.porcentajeOcupacionNumerico(item.ocupacionEstimada));
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

  private nombreMes(mes: number): string {
    return this.meses.find((item) => item.valor === mes)?.nombre ?? String(mes);
  }

  private porcentajeNumerico(valor: number | null | undefined): number {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) {
      return 0;
    }
    return valor <= 1 ? valor * 100 : valor;
  }

  private porcentajeOcupacionNumerico(valor: number | null | undefined): number {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) {
      return 0;
    }
    return valor * 100;
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
