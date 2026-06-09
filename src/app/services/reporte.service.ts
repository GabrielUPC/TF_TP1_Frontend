import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}