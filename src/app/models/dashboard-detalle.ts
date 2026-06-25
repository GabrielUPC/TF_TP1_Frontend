export interface DashboardDetalle {
  idPrediccion: number;
  idIndicador: number;
  idRegistro: number;
  idArchivo: number;
  nombreArchivo: string;

  anio: number;
  mes: number;
  anioPredicho?: number;
  mesPredicho?: number;
  servicioHospitalario: string;
  codigoIpress?: string;

  ingresos: number;
  egresos: number;
  estancias: number;
  pacientesCama: number;
  camasTotales: number;
  camasDisponiblesHabilitadas: number;
  totalCamasDisponibles?: number | null;

  ocupacionEstimada: number;
  presionIngresosCamas: number;
  promedioEstancia: number;
  rotacionCamas: number;

  nivelRiesgo: string;

  // Probabilidad de la clase predicha: BAJO, MEDIO o ALTO
  probabilidad: number;

  // Probabilidad específica de riesgo ALTO
  probabilidadRiesgoBajo?: number | null;
  probabilidadRiesgoMedio?: number | null;
  probabilidadRiesgoAlto?: number | null;
  
  riesgoInsuficienciaCapacidad?: number | null;

  modeloUtilizado: string;
  fechaPrediccion: string;

  alerta: string;
  interpretacion: string;
  causaPrincipalRiesgo?: string | null;
  brechaOperativa?: number | null;
  nivelBrechaOperativa?: string | null;
  diagnosticoOperativo?: string | null;
  recomendacionesOperativas?: string[] | null;
  interpretacionModelo?: string | null;
  confianzaPrediccion?: number | null;
  
}
