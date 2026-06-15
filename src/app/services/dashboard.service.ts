import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { DashboardResumen } from '../models/dashboard-resumen';
import { DashboardDetalle } from '../models/dashboard-detalle';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly apiUrl = `${environment.base}/dashboard`;

  constructor(private http: HttpClient) {}

  obtenerResumen(idArchivo?: number): Observable<DashboardResumen> {
    const params = this.crearParamsArchivo(idArchivo);
    return this.http.get<DashboardResumen>(
      `${this.apiUrl}/resumen`,
      { params }
    );
  }

  obtenerDetalle(idArchivo?: number): Observable<DashboardDetalle[]> {
    const params = this.crearParamsArchivo(idArchivo);
    return this.http.get<DashboardDetalle[]>(
      `${this.apiUrl}/detalle`,
      { params }
    );
  }

  obtenerAlertas(idArchivo?: number): Observable<DashboardDetalle[]> {
    const params = this.crearParamsArchivo(idArchivo);
    return this.http.get<DashboardDetalle[]>(
      `${this.apiUrl}/alertas`,
      { params }
    );
  }

  filtrar(
    idArchivo?: number,
    anio?: number,
    mes?: number,
    servicioHospitalario?: string
  ): Observable<DashboardDetalle[]> {
    let params = new HttpParams();

    if (idArchivo !== undefined) {
      params = params.set('idArchivo', idArchivo);
    }

    if (anio !== undefined) {
      params = params.set('anio', anio);
    }

    if (mes !== undefined) {
      params = params.set('mes', mes);
    }

    if (servicioHospitalario) {
      params = params.set('servicioHospitalario', servicioHospitalario);
    }

    return this.http.get<DashboardDetalle[]>(`${this.apiUrl}/filtro`, { params });
  }

  private crearParamsArchivo(idArchivo?: number): HttpParams {
    return idArchivo === undefined
      ? new HttpParams()
      : new HttpParams().set('idArchivo', idArchivo);
  }
}
