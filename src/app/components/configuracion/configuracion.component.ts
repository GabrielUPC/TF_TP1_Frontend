import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SesionUsuario } from '../../models/sesion-usuario';
import { AuthService } from '../../services/auth.service';

interface ConfiguracionRol {
  alcance: string;
  permisos: string[];
  accionPrincipal: string;
  rutaPrincipal: string;
}

@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, RouterLink],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent {
  private readonly configuracionPorRol: Record<string, ConfiguracionRol> = {
    ADMINISTRADOR: {
      alcance: 'Administra las cuentas, los roles y la IPRESS asignada a cada usuario.',
      permisos: [
        'Registrar y editar usuarios',
        'Asignar roles e IPRESS',
        'Activar o inactivar cuentas',
        'Restablecer accesos'
      ],
      accionPrincipal: 'Gestionar usuarios',
      rutaPrincipal: '/usuarios'
    },
    ADMISION_REGISTROS: {
      alcance: 'Gestiona únicamente la información hospitalaria correspondiente a su IPRESS.',
      permisos: [
        'Descargar la plantilla hospitalaria',
        'Cargar y validar archivos Excel',
        'Corregir y procesar información',
        'Consultar el historial de archivos'
      ],
      accionPrincipal: 'Ir a carga de datos',
      rutaPrincipal: '/carga-excel'
    },
    ATENCION_HOSPITALIZACION: {
      alcance: 'Consulta indicadores y resultados predictivos de la IPRESS asignada.',
      permisos: [
        'Consultar el dashboard predictivo',
        'Revisar indicadores hospitalarios y de camas',
        'Consultar alertas y niveles de riesgo',
        'Visualizar reportes básicos'
      ],
      accionPrincipal: 'Ir al dashboard',
      rutaPrincipal: '/dashboard'
    }
  };

  constructor(public authService: AuthService) {}

  obtenerUsuario(): SesionUsuario | null {
    return this.authService.obtenerUsuarioActual();
  }

  obtenerConfiguracionRol(): ConfiguracionRol | null {
    const rol = this.obtenerUsuario()?.rol;
    return rol ? this.configuracionPorRol[rol] ?? null : null;
  }

  obtenerIpress(): string {
    const usuario = this.obtenerUsuario();

    if (usuario?.rol === 'ADMINISTRADOR') {
      return 'Acceso administrativo general';
    }

    return usuario?.ipressAsignada || usuario?.nombreIpress || 'No asignada';
  }
}
