export interface PrediccionBinariaAutomaticaRequest {
  servicio: string;
  periodo_actual: string;
}

export type NivelRiesgoPresentacion = 'BAJO' | 'MEDIO' | 'ALTO';

export interface PrediccionBinariaAutomaticaResponse {
  probabilidad_alta_presion: number;
  threshold: number;
  alerta_alta_presion: boolean;
  nivel_riesgo: NivelRiesgoPresentacion;
  descripcion_riesgo: string;
  umbral_bajo_medio: number;
  codigo_ipress: string;
  servicio_hospitalizacion: string;
  periodo_actual: string;
  periodo_predicho: string;
  horizonte_prediccion?: string;
  modelo: string;
}

export interface PrediccionBinariaAutomaticaError {
  estado?: string;
  codigo?: string;
  mensaje?: string;
  periodos_faltantes?: string[];
}

export interface OpcionIpressPrediccion {
  codigo: string;
  etiqueta: string;
}

export interface CatalogoPrediccionBinaria {
  codigoIpress: string;
  nombreIpress: string;
  servicios: ServicioCatalogoPrediccion[];
}

export interface ServicioCatalogoPrediccion {
  servicio: string;
  periodosDisponibles: string[];
}
