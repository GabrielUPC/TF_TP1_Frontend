import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Reporte } from '../models/reporte';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private apiUrl = `${environment.base}/reportes`;

  constructor(private http: HttpClient) {}

  listarReportes(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(this.apiUrl);
  }

  obtenerReportePorId(idReporte: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.apiUrl}/${idReporte}`);
  }

  listarPorArchivo(idArchivo: number): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.apiUrl}/archivo/${idArchivo}`);
  }

  filtrarReportes(filtros: {
    idArchivo?: number;
    anio?: number;
    mes?: number;
    servicioHospitalario?: string;
    nivelRiesgo?: string;
  }): Observable<Reporte[]> {
    let params = new HttpParams();

    if (filtros.idArchivo !== undefined) {
      params = params.set('idArchivo', filtros.idArchivo);
    }

    if (filtros.anio !== undefined) {
      params = params.set('anio', filtros.anio);
    }

    if (filtros.mes !== undefined) {
      params = params.set('mes', filtros.mes);
    }

    if (filtros.servicioHospitalario) {
      params = params.set(
        'servicioHospitalario',
        filtros.servicioHospitalario
      );
    }

    if (filtros.nivelRiesgo && filtros.nivelRiesgo !== 'TODOS') {
      params = params.set('nivelRiesgo', filtros.nivelRiesgo);
    }

    return this.http.get<Reporte[]>(this.apiUrl, { params });
  }
}
