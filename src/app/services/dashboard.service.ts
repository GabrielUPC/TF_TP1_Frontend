import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardResumen } from '../models/dashboard-resumen';
import { DashboardDetalle } from '../models/dashboard-detalle';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'http://localhost:8080/dashboard';

  constructor(private http: HttpClient) {}

  obtenerResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.apiUrl}/resumen`);
  }

  obtenerDetalle(): Observable<DashboardDetalle[]> {
    return this.http.get<DashboardDetalle[]>(`${this.apiUrl}/detalle`);
  }

  obtenerAlertas(): Observable<DashboardDetalle[]> {
    return this.http.get<DashboardDetalle[]>(`${this.apiUrl}/alertas`);
  }

  filtrar(anio?: number, mes?: number, servicioHospitalario?: string): Observable<DashboardDetalle[]> {
    let params: string[] = [];

    if (anio) {
      params.push(`anio=${anio}`);
    }

    if (mes) {
      params.push(`mes=${mes}`);
    }

    if (servicioHospitalario) {
      params.push(`servicioHospitalario=${servicioHospitalario}`);
    }

    const queryParams = params.length > 0 ? `?${params.join('&')}` : '';

    return this.http.get<DashboardDetalle[]>(`${this.apiUrl}/filtro${queryParams}`);
  }
}