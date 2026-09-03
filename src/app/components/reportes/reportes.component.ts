import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { ArchivoProcesado } from '../../models/archivo-procesado';
import { Reporte } from '../../models/reporte';
import { ArchivoService } from '../../services/archivo.service';
import { ReporteService } from '../../services/reporte.service';

type SeleccionArchivo = 'TODOS' | 'ULTIMO' | number;

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {

  reportes: Reporte[] = [];
  reportesFiltrados: Reporte[] = [];
  private reportesCatalogo: Reporte[] = [];
  archivosProcesados: ArchivoProcesado[] = [];

  cargando = false;
  error = '';

  seleccionArchivo: SeleccionArchivo = 'TODOS';
  idArchivoFiltro: number | null = null;
  anioFiltro: number | null = null;
  mesFiltro: number | null = null;
  servicioFiltro = '';
  filtroRiesgo = 'TODOS';

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

  constructor(
    private reporteService: ReporteService,
    private archivoService: ArchivoService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.reiniciarFiltros();
    this.cargando = true;
    this.error = '';

    forkJoin({
      reportes: this.reporteService.listarReportes(),
      archivos: this.archivoService.listarArchivosProcesados().pipe(
        catchError((error) => {
          console.error('Error al cargar archivos procesados:', error);
          return of([] as ArchivoProcesado[]);
        })
      )
    }).subscribe({
      next: ({ reportes, archivos }) => {
        this.reportes = reportes;
        this.reportesFiltrados = reportes;
        this.reportesCatalogo = reportes;
        this.archivosProcesados = archivos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.error = 'No se pudieron cargar los reportes. Verifica que el backend esté activo.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.error = '';

    this.reporteService.filtrarReportes({
      idArchivo: this.idArchivoFiltro ?? undefined,
      anio: this.anioFiltro ?? undefined,
      mes: this.mesFiltro ?? undefined,
      servicioHospitalario: this.servicioFiltro.trim() || undefined,
      nivelRiesgo: this.filtroRiesgo
    }).subscribe({
      next: (data) => {
        this.reportes = data;
        this.reportesFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al filtrar reportes:', error);
        this.error = 'No se pudieron aplicar los filtros de reportes.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.reiniciarFiltros();
    this.aplicarFiltros();
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

    return this.archivosProcesados.find(
      (archivo) => archivo.idArchivo === this.idArchivoFiltro
    )?.nombreArchivo ?? 'Sin archivo';
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

  get totalReportes(): number {
    return this.reportesFiltrados.length;
  }

  contarRiesgo(nivel: string): number {
    return this.reportesFiltrados.filter(
      (reporte) => reporte.nivelRiesgo?.toUpperCase() === nivel
    ).length;
  }

  obtenerMesPredicho(item: Reporte | null | undefined): number | null {
    if (!item?.mes) {
      return null;
    }
    return item.mes === 12 ? 1 : item.mes + 1;
  }

  obtenerAnioPredicho(item: Reporte | null | undefined): number | null {
    if (!item?.anio || !item?.mes) {
      return null;
    }
    return item.mes === 12 ? item.anio + 1 : item.anio;
  }

  formatearPeriodoBase(item: Reporte | null | undefined): string {
    if (!item?.mes || !item?.anio) {
      return 'Sin periodo';
    }
    return `${item.mes}/${item.anio}`;
  }

  formatearPeriodoPredicho(item: Reporte | null | undefined): string {
    const mes = item?.mesPredicho ?? this.obtenerMesPredicho(item);
    const anio = item?.anioPredicho ?? this.obtenerAnioPredicho(item);

    if (!mes || !anio) {
      return 'Sin periodo';
    }
    return `${mes}/${anio}`;
  }

  obtenerClaseRiesgo(nivelRiesgo: string | null | undefined): string {
    const riesgo = nivelRiesgo?.toUpperCase();
    if (riesgo === 'ALTO') {
      return 'badge-alto';
    }
    if (riesgo === 'MEDIO') {
      return 'badge-medio';
    }
    return 'badge-bajo';
  }

  convertirPorcentaje(valor: number | null | undefined): string {
    const porcentaje = valor !== null
      && valor !== undefined
      && Number.isFinite(valor)
      ? (valor <= 1 ? valor * 100 : valor)
      : 0;
    return `${porcentaje.toFixed(1)}%`;
  }

  formatearProbabilidad(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || !Number.isFinite(valor)
        || valor < 0 || valor > 1) return 'N/D';
    return `${(valor * 100).toFixed(1)}%`;
  }

  formatearNumero(
    valor: number | null | undefined,
    decimales = 2
  ): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimales
    }).format(valor ?? 0);
  }

  exportarCsv(): void {
    if (this.reportesFiltrados.length === 0) {
      return;
    }

    const encabezados = [
      'ID Reporte',
      'Archivo',
      'ID Archivo',
      'Servicio hospitalario',
      'Periodo base',
      'Periodo predicho',
      'Riesgo predicho',
      'Probabilidad de la clase predicha',
      'Ocupación',
      'Presión ingresos/camas',
      'Promedio estancia',
      'Modelo utilizado',
      'Generado por',
      'Fecha generación'
    ];

    const filas = this.reportesFiltrados.map((reporte) => [
      reporte.idReporte,
      reporte.nombreArchivo,
      reporte.idArchivo,
      reporte.servicioHospitalario,
      this.formatearPeriodoBase(reporte),
      this.formatearPeriodoPredicho(reporte),
      reporte.nivelRiesgo,
      this.formatearProbabilidad(reporte.probabilidad),
      this.convertirPorcentaje(reporte.ocupacionEstimada),
      this.formatearNumero(reporte.presionIngresosCamas),
      this.formatearNumero(reporte.promedioEstancia),
      reporte.modeloUtilizado,
      reporte.usuarioGenerador,
      this.formatearFechaCsv(reporte.fechaGeneracion)
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map((valor) => this.escaparCsv(valor)).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${contenido}`], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reportes_filtrados_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private get catalogoSegunArchivo(): Reporte[] {
    if (this.idArchivoFiltro === null) {
      return this.reportesCatalogo;
    }
    return this.reportesCatalogo.filter(
      (item) => item.idArchivo === this.idArchivoFiltro
    );
  }

  private reiniciarFiltros(): void {
    this.seleccionArchivo = 'TODOS';
    this.idArchivoFiltro = null;
    this.anioFiltro = null;
    this.mesFiltro = null;
    this.servicioFiltro = '';
    this.filtroRiesgo = 'TODOS';
  }

  private escaparCsv(valor: unknown): string {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    return `"${texto.replace(/"/g, '""')}"`;
  }

  private formatearFechaCsv(fecha: string | null | undefined): string {
    if (!fecha) {
      return '';
    }
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime())
      ? fecha
      : valor.toLocaleString('es-PE');
  }
}
