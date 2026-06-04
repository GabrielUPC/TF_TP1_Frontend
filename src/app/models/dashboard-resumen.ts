export interface DashboardResumen {
  totalPredicciones: number;
  totalRiesgoBajo: number;
  totalRiesgoMedio: number;
  totalRiesgoAlto: number;

  promedioOcupacionEstimada: number;
  promedioPresionIngresosCamas: number;
  promedioProbabilidad: number;

  totalIngresos: number;
  totalEgresos: number;
  totalEstancias: number;
  totalPacientesCama: number;
  totalCamasDisponiblesHabilitadas: number;

  nivelRiesgoPredominante: string;
  mensajeResumen: string;
}