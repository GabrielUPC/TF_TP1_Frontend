export interface DashboardDetalle {
  idIndicador: number; idRegistro: number; idArchivo: number; nombreArchivo: string;
  anio: number; mes: number; servicioHospitalario: string; codigoIpress: string;
  ingresos: number; egresos: number; estancias: number; pacientesCama: number;
  camasTotales: number; camasDisponiblesHabilitadas?: number | null;
  totalCamasDisponibles?: number | null;
  ocupacionEstimada: number; presionIngresosCamas: number;
  promedioEstancia: number; rotacionCamas: number;
  idPrediccion?: number | null; probabilidadAltaPresion?: number | null;
  threshold?: number | null; alertaAltaPresion?: boolean | null;
  nivelRiesgo?: string | null; descripcionRiesgo?: string | null;
  periodoPredicho?: string | null; modeloUtilizado?: string | null;
  fechaPrediccion?: string | null;
}
