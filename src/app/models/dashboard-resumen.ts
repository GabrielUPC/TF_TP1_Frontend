export interface DashboardResumen {
  totalRegistros: number; totalPredicciones: number;
  totalRiesgoBajo: number; totalRiesgoMedio: number; totalRiesgoAlto: number;
  promedioOcupacionEstimada: number | null; promedioPresionIngresosCamas: number | null;
  promedioProbabilidadAltaPresion: number;
  totalIngresos: number; totalEgresos: number; totalEstancias: number;
  totalPacientesCama: number; totalCamasDisponiblesHabilitadas: number;
  totalDiasCamaDisponibles: number; nivelRiesgoPredominante: string;
  mensajeResumen: string;
}
