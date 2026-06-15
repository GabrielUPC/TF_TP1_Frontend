import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environment';
import { ArchivoCargado } from '../models/archivo-cargado';
import { ArchivoProcesado } from '../models/archivo-procesado';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {

  private readonly apiUrl = `${environment.base}/archivos`;

  constructor(private http: HttpClient) {}

  listarArchivos(): Observable<ArchivoCargado[]> {
    return this.http.get<ArchivoCargado[]>(this.apiUrl);
  }

  listarArchivosProcesados(): Observable<ArchivoProcesado[]> {
    return this.http.get<ArchivoProcesado[]>(`${this.apiUrl}/procesados`);
  }

  obtenerArchivoPorId(idArchivo: number): Observable<ArchivoCargado> {
    return this.http.get<ArchivoCargado>(`${this.apiUrl}/${idArchivo}`);
  }
}
