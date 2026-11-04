export interface ArchivoCargado {
  idArchivo: number;
  nombreArchivo: string;
  formato: string;
  fechaCarga: string;
  fechaCargaUtc?: string | null;
  estadoValidacion: string;
  estadoProcesamiento: string;
  nombreUsuario: string;
  nombreIpress: string;
}
