import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environment';
import { Usuario, UsuarioRegistro } from '../models/usuario';
import { Rol } from '../models/rol';
import { Ipress } from '../models/ipress';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private usuariosUrl = `${environment.base}/usuarios`;
  private rolesUrl = `${environment.base}/roles`;
  private ipressUrl = `${environment.base}/ipress`;

  constructor(private http: HttpClient) {}

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.usuariosUrl);
  }

  obtenerUsuarioPorId(idUsuario: number): Observable<UsuarioRegistro> {
    return this.http.get<UsuarioRegistro>(`${this.usuariosUrl}/${idUsuario}`);
  }

  registrarUsuario(usuario: UsuarioRegistro): Observable<void> {
    return this.http.post<void>(this.usuariosUrl, usuario);
  }

  modificarUsuario(usuario: UsuarioRegistro): Observable<void> {
    return this.http.put<void>(this.usuariosUrl, usuario);
  }

  activarUsuario(idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.usuariosUrl}/${idUsuario}/activar`, null);
  }

  inactivarUsuario(idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.usuariosUrl}/${idUsuario}/inactivar`, null);
  }

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.rolesUrl);
  }

  listarIpress(): Observable<Ipress[]> {
    return this.http.get<Ipress[]>(this.ipressUrl);
  }
}