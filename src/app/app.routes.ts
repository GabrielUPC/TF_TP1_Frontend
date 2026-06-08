import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { RecuperarPasswordComponent } from './components/recuperar-password/recuperar-password.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CargaExcelComponent } from './components/carga-excel/carga-excel.component';
import { ArchivosComponent } from './components/archivos/archivos.component';
import { AlertasComponent } from './components/alertas/alertas.component';
import { ReportesComponent } from './components/reportes/reportes.component';
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
    path: 'alertas',
    component: AlertasComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ATENCION_HOSPITALIZACION'] }
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
  }
];