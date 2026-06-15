export interface Reporte {
  idReporte: number;
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

  ocupacionEstimada: number;
  presionIngresosCamas: number;
  promedioEstancia: number;
  rotacionCamas: number;

  nivelRiesgo: string;
  probabilidad: number;
  modeloUtilizado: string;
  fechaPrediccion: string;

  fechaGeneracion: string;
  usuarioGenerador: string;
  rutaArchivo: string;
}
