import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CatalogoPrediccionBinaria,
  OpcionIpressPrediccion,
  NivelRiesgoPresentacion,
  PrediccionBinariaAutomaticaError,
  PrediccionBinariaAutomaticaResponse
} from '../../models/prediccion-binaria';
import { AuthService } from '../../services/auth.service';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';

@Component({
  selector: 'app-prediccion-binaria',
  imports: [CommonModule, FormsModule],
  templateUrl: './prediccion-binaria.component.html',
  styleUrl: './prediccion-binaria.component.css'
})
export class PrediccionBinariaComponent implements OnInit {
  private catalogo: CatalogoPrediccionBinaria | null = null;

  ipresses: OpcionIpressPrediccion[] = [];
  servicios: string[] = [];
  codigoIpress = '';
  servicio = '';
  periodoActual = '';

  cargandoCatalogo = false;
  cargandoPrediccion = false;
  errorCatalogo = '';
  errorPrediccion = '';
  resultado: PrediccionBinariaAutomaticaResponse | null = null;

  constructor(
    private prediccionService: PrediccionBinariaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.errorCatalogo = '';

    this.prediccionService.obtenerCatalogo().subscribe({
      next: (catalogo) => {
        this.catalogo = catalogo;
        this.ipresses = catalogo.codigoIpress ? [{
          codigo: catalogo.codigoIpress,
          etiqueta: catalogo.nombreIpress
            ? `${catalogo.nombreIpress} (${catalogo.codigoIpress})` : catalogo.codigoIpress
        }] : [];
        this.codigoIpress = catalogo.codigoIpress || '';
        this.actualizarServicios();
        this.cargandoCatalogo = false;
      },
      error: () => {
        this.errorCatalogo = 'No se pudo cargar el catálogo de IPRESS y servicios.';
        this.cargandoCatalogo = false;
      }
    });
  }

  actualizarServicios(): void {
    this.servicio = '';
    this.resultado = null;
    this.errorPrediccion = '';
    this.servicios = (this.catalogo?.servicios ?? [])
      .map(item => item.servicio).sort((a, b) => a.localeCompare(b, 'es'));
  }

  limpiarResultado(): void {
    this.resultado = null;
    this.errorPrediccion = '';
  }

  predecir(): void {
    if (!this.formularioValido || this.cargandoPrediccion) {
      return;
    }

    this.cargandoPrediccion = true;
    this.errorPrediccion = '';
    this.resultado = null;

    this.prediccionService.predecir({
      servicio: this.servicio,
      periodo_actual: this.periodoActual
    }).subscribe({
      next: (respuesta) => {
        if (!this.respuestaValida(respuesta)) {
          this.errorPrediccion = this.mensajeError('RESPUESTA_MODELO_INCONSISTENTE');
        } else {
          this.resultado = respuesta;
        }
        this.cargandoPrediccion = false;
      },
      error: (error: HttpErrorResponse) => {
        const detalle = error.error as PrediccionBinariaAutomaticaError | null;
        this.errorPrediccion = this.mensajeError(detalle?.codigo, detalle?.periodos_faltantes);
        this.cargandoPrediccion = false;
      }
    });
  }

  get formularioValido(): boolean {
    return Boolean(this.codigoIpress && this.servicio && /^\d{4}-(0[1-9]|1[0-2])$/.test(this.periodoActual));
  }

  formatearPorcentaje(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(valor);
  }

  get anchoProbabilidad(): number {
    return Math.min(100, Math.max(0, (this.resultado?.probabilidad_alta_presion ?? 0) * 100));
  }

  get posicionThreshold(): number {
    return Math.min(100, Math.max(0, (this.resultado?.threshold ?? 0) * 100));
  }

  get posicionBajoMedio(): number {
    return Math.min(100, Math.max(0, (this.resultado?.umbral_bajo_medio ?? 0) * 100));
  }

  claseNivel(nivel: NivelRiesgoPresentacion): string {
    return `risk-${nivel.toLowerCase()}`;
  }

  etiquetaNivel(nivel: NivelRiesgoPresentacion): string {
    const etiquetas: Record<NivelRiesgoPresentacion, string> = {
      BAJO: 'Riesgo bajo',
      MEDIO: 'Riesgo medio',
      ALTO: 'Riesgo alto'
    };
    return etiquetas[nivel];
  }

  mensajeError(codigo?: string, periodosFaltantes: string[] = []): string {
    const mensajes: Record<string, string> = {
      SOLICITUD_INVALIDA: 'Revisa la IPRESS, el servicio y el periodo seleccionados.',
      IPRESS_NO_EXISTE: 'La IPRESS seleccionada ya no se encuentra disponible.',
      SERVICIO_NO_EXISTE: 'El servicio seleccionado no tiene registros en esta IPRESS.',
      PERIODO_DUPLICADO: 'Se detectó una inconsistencia de datos para el periodo seleccionado.',
      HISTORIAL_INSUFICIENTE: 'No existen suficientes meses consecutivos para realizar la predicción.',
      MES_INTERMEDIO_FALTANTE: 'Falta información de uno o más meses necesarios para realizar la predicción.',
      CALIDAD_PENDIENTE: 'Los datos seleccionados todavía tienen validaciones de calidad pendientes.',
      CALIDAD_INVALIDA: 'Los datos seleccionados no cumplen los criterios de calidad necesarios para realizar la predicción.',
      DATOS_INCOMPLETOS: 'Los datos del historial están incompletos y no permiten realizar la predicción.',
      SERVICIO_FUERA_ALCANCE: 'El servicio seleccionado está fuera del alcance del modelo.',
      RESPUESTA_MODELO_INCONSISTENTE: 'No fue posible obtener una predicción válida. Intente nuevamente o contacte al administrador.'
    };
    const base = mensajes[codigo ?? '']
      ?? 'No se pudo realizar la predicción. Intente nuevamente o contacte al administrador.';
    return periodosFaltantes.length > 0
      ? `${base} Periodos faltantes: ${periodosFaltantes.join(', ')}.`
      : base;
  }

  private respuestaValida(respuesta: PrediccionBinariaAutomaticaResponse | null): boolean {
    return Boolean(
      respuesta
      && Number.isFinite(respuesta.probabilidad_alta_presion)
      && respuesta.probabilidad_alta_presion >= 0
      && respuesta.probabilidad_alta_presion <= 1
      && Number.isFinite(respuesta.threshold)
      && respuesta.threshold === 0.36
      && Number.isFinite(respuesta.umbral_bajo_medio)
      && respuesta.umbral_bajo_medio === 0.20
      && typeof respuesta.alerta_alta_presion === 'boolean'
      && ['BAJO', 'MEDIO', 'ALTO'].includes(respuesta.nivel_riesgo)
      && (respuesta.nivel_riesgo === 'ALTO') === respuesta.alerta_alta_presion
      && Boolean(respuesta.descripcion_riesgo?.trim())
      && respuesta.codigo_ipress
      && respuesta.servicio_hospitalizacion
      && /^\d{4}-(0[1-9]|1[0-2])$/.test(respuesta.periodo_actual)
      && /^\d{4}-(0[1-9]|1[0-2])$/.test(respuesta.periodo_predicho)
      && respuesta.modelo
    );
  }
}
