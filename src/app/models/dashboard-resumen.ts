export interface DashboardResumen {
  mensajeResumen: string;
  nivelRiesgoPredominante: string;
  promedioOcupacionEstimada: number;
  promedioPresionIngresosCamas: number;
  promedioProbabilidad: number;
  totalCamasDisponiblesHabilitadas: number;
  totalEgresos: number;
  totalEstancias: number;
  totalIngresos: number;
  totalPacientesCama: number;
  totalPredicciones: number;
  totalRiesgoAlto: number;
  totalRiesgoBajo: number;
  totalRiesgoMedio: number;
}