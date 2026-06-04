import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ArchivoCargado } from '../models/archivo-cargado';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {

  private apiUrl = 'http://localhost:8080/archivos';

  constructor(private http: HttpClient) {}

  listarArchivos(): Observable<ArchivoCargado[]> {
    return this.http.get<ArchivoCargado[]>(this.apiUrl);
  }

  obtenerArchivoPorId(idArchivo: number): Observable<ArchivoCargado> {
    return this.http.get<ArchivoCargado>(`${this.apiUrl}/${idArchivo}`);
  }
}