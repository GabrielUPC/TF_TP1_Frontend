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
  probabilidad: number;
  modeloUtilizado: string;
  fechaPrediccion: string;

  alerta: string;
  interpretacion: string;
}
