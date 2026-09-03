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

  // Probabilidad de la clase FINAL recibida; no necesariamente max(p).
  probabilidad: number | null;

  // Salidas originales por clase; pueden faltar en registros históricos.
  probabilidadRiesgoBajo?: number | null;
  probabilidadRiesgoMedio?: number | null;
  probabilidadRiesgoAlto?: number | null;
  
  // Índice visual/operativo legado, no probabilidad calibrada de insuficiencia.
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
