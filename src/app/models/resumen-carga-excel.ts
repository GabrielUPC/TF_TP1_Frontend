import { ErrorValidacion } from './error-validacion';

export interface ResumenCargaExcel {
  idArchivo: number;
  nombreArchivo: string;
  formato: string;
  estadoValidacion: string;
  estadoProcesamiento: string;
  totalFilasLeidas: number;
  registrosValidos: number;
  registrosConErrores: number;
  formatoDetectado: string;
  totalFilasInvalidas?: number;
  totalRegistrosValidos?: number;
  totalPrediccionesGeneradas: number;
  advertencias: string[];
  columnasEncontradas: string[];
  columnasMinimasFormatoInterno: string[];
  columnasMinimasDatasetD1: string[];
  mensaje: string;
  errores: ErrorValidacion[];
}
