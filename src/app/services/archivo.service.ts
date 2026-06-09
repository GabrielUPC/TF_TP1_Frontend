import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environment';
import { ArchivoCargado } from '../models/archivo-cargado';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {

  private readonly apiUrl = `${environment.base}/archivos`;

  constructor(private http: HttpClient) {}

  listarArchivos(): Observable<ArchivoCargado[]> {
    return this.http.get<ArchivoCargado[]>(this.apiUrl);
  }

  obtenerArchivoPorId(idArchivo: number): Observable<ArchivoCargado> {
    return this.http.get<ArchivoCargado>(`${this.apiUrl}/${idArchivo}`);
  }
}
