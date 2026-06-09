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
    let params = new HttpParams();

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
}
