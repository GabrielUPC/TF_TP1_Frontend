import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CargaExcelComponent } from './components/carga-excel/carga-excel.component';
import { ArchivosComponent } from './components/archivos/archivos.component';
import { AlertasComponent } from './components/alertas/alertas.component';
import { ReportesComponent } from './components/reportes/reportes.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'carga-excel',
    component: CargaExcelComponent
  },
  {
    path: 'archivos',
    component: ArchivosComponent
  },
  {
    path: 'alertas',
    component: AlertasComponent
  },
  {
    path: 'reportes',
    component: ReportesComponent
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];