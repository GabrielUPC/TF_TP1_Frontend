export interface PendienteCalidad {
  fila: number;
  codigoIpress: string;
  anio: number;
  mes: number;
  servicioHospitalario: string;
  regla: 'Q05' | 'Q06';
  motivo: string;
  estado: 'PENDIENTE_VALIDACION';
}
