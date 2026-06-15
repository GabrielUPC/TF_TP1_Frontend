export interface ArchivoProcesado {
  idArchivo: number;
  nombreArchivo: string;
  fechaCarga: string;
  formatoDetectado: string;
  anioMinimo?: number | null;
  anioMaximo?: number | null;
  registrosValidos: number;
  prediccionesGeneradas: number;
}
