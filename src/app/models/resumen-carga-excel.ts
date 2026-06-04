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
  mensaje: string;
  errores: ErrorValidacion[];
}