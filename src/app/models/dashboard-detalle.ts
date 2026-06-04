export interface DashboardDetalle {
  idArchivo: number;
  idRegistro: number;
  idIndicador: number;
  idPrediccion: number;
  nombreArchivo: string;
  anio: number;
  mes: number;
  servicioHospitalario: string;
  ingresos: number;
  egresos: number;
  estancias: number;
  pacientesCama: number;
  camasTotales: number;
  camasDisponiblesHabilitadas: number;
  ocupacionEstimada: number;
  presionIngresosCamas: number;
  promedioEstancia: number;
  rotacionCamas: number;
  nivelRiesgo: string;
  probabilidad: number;
  modeloUtilizado: string;
  fechaPrediccion: string;
  alerta?: string;
}