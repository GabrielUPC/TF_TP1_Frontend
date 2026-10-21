import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environment';
import {
  CatalogoPrediccionBinaria,
  PrediccionBinariaAutomaticaRequest,
  PrediccionBinariaAutomaticaResponse
} from '../models/prediccion-binaria';

@Injectable({ providedIn: 'root' })
export class PrediccionBinariaService {
  private readonly endpoint = `${environment.base}/predicciones-riesgo/binaria/automatica`;
  private readonly catalogoEndpoint = `${environment.base}/predicciones-riesgo/binaria/catalogo`;

  constructor(private http: HttpClient) {}

  obtenerCatalogo(): Observable<CatalogoPrediccionBinaria> {
    return this.http.get<CatalogoPrediccionBinaria>(this.catalogoEndpoint);
  }

  predecir(
    solicitud: PrediccionBinariaAutomaticaRequest
  ): Observable<PrediccionBinariaAutomaticaResponse> {
    return this.http.post<PrediccionBinariaAutomaticaResponse>(this.endpoint, solicitud);
  }
}
