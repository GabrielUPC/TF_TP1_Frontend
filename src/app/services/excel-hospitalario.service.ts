import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ResumenCargaExcel } from '../models/resumen-carga-excel';

@Injectable({
  providedIn: 'root'
})
export class ExcelHospitalarioService {

  private apiUrl = 'http://localhost:8080/excel-hospitalario';

  constructor(private http: HttpClient) {}

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plantilla`, {
      responseType: 'blob'
    });
  }

  cargarExcel(
    archivo: File,
    idUsuario: number,
    idIpress: number
  ): Observable<ResumenCargaExcel> {

    const formData = new FormData();

    formData.append('archivo', archivo);
    formData.append('idUsuario', idUsuario.toString());
    formData.append('idIpress', idIpress.toString());

    return this.http.post<ResumenCargaExcel>(`${this.apiUrl}/cargar`, formData);
  }
}