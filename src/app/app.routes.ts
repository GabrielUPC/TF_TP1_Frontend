import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RecuperarPasswordComponent } from './components/recuperar-password/recuperar-password.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CargaExcelComponent } from './components/carga-excel/carga-excel.component';
import { ArchivosComponent } from './components/archivos/archivos.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { InicioAdminComponent } from './components/inicio-admin/inicio-admin.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'recuperar-password',
    component: RecuperarPasswordComponent
  },
  {
    path: 'inicio',
    component: InicioAdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ATENCION_HOSPITALIZACION'] }
  },
  {
    path: 'carga-excel',
    component: CargaExcelComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMISION_REGISTROS'] }
  },
  {
    path: 'archivos',
    component: ArchivosComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMISION_REGISTROS'] }
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ATENCION_HOSPITALIZACION'] }
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  {
    path: 'configuracion',
    component: ConfiguracionComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: [
        'ADMINISTRADOR',
        'ADMISION_REGISTROS',
        'ATENCION_HOSPITALIZACION'
      ]
    }
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
