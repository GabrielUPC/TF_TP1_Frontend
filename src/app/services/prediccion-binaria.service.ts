import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environment';
import { DashboardDetalle } from '../models/dashboard-detalle';
import {
  PrediccionBinariaAutomaticaRequest,
  PrediccionBinariaAutomaticaResponse
} from '../models/prediccion-binaria';

@Injectable({ providedIn: 'root' })
export class PrediccionBinariaService {
  private readonly endpoint = `${environment.base}/predicciones-riesgo/binaria/automatica`;
  private readonly catalogoEndpoint = `${environment.base}/dashboard/detalle`;

  constructor(private http: HttpClient) {}

  obtenerCatalogo(): Observable<DashboardDetalle[]> {
    return this.http.get<DashboardDetalle[]>(this.catalogoEndpoint);
  }

  predecir(
    solicitud: PrediccionBinariaAutomaticaRequest
  ): Observable<PrediccionBinariaAutomaticaResponse> {
    return this.http.post<PrediccionBinariaAutomaticaResponse>(this.endpoint, solicitud);
  }
}
