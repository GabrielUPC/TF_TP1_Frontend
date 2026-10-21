import { of } from 'rxjs';

import { ReportesComponent } from './reportes.component';
import { Reporte } from '../../models/reporte';

describe('ReportesComponent', () => {
  let componente: ReportesComponent;

  beforeEach(() => {
    const reporteService = jasmine.createSpyObj('ReporteService', ['listarReportes', 'filtrarReportes']);
    const archivoService = jasmine.createSpyObj('ArchivoService', ['listarArchivosProcesados']);
    reporteService.listarReportes.and.returnValue(of([]));
    archivoService.listarArchivosProcesados.and.returnValue(of([]));
    componente = new ReportesComponent(reporteService, archivoService);
  });

  it('exporta solo los reportes filtrados con terminología binaria, threshold y alerta', () => {
    const reporte = {
      idReporte: 7, idArchivo: 4, nombreArchivo: 'D1.csv',
      servicioHospitalario: 'PEDIATRIA', anio: 2025, mes: 4,
      anioPredicho: 2025, mesPredicho: 5, nivelRiesgo: 'MEDIO',
      probabilidadAltaPresion: 0.34, threshold: 0.36,
      alertaAltaPresion: false, ocupacionEstimada: 0.94,
      presionIngresosCamas: 5.96, promedioEstancia: 4.18,
      modeloUtilizado: 'modelo_ipress_binario_v1',
      usuarioGenerador: 'Miguel', fechaGeneracion: '2026-09-12T10:00:00'
    } as Reporte;
    componente.reportesFiltrados = [reporte];
    const crearUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:qa');
    spyOn(URL, 'revokeObjectURL');
    const click = spyOn(HTMLAnchorElement.prototype, 'click');

    componente.exportarCsv();

    expect(crearUrl).toHaveBeenCalled();
    const blob = crearUrl.calls.mostRecent().args[0] as Blob;
    expect(click).toHaveBeenCalled();
    return blob.text().then(contenido => {
      expect(contenido).toContain('Probabilidad de alta presión en t+1');
      expect(contenido).toContain('Threshold operacional');
      expect(contenido).toContain('Alerta operacional');
      expect(contenido).toContain('36.0%');
      expect(contenido).toContain('NO ACTIVA');
      expect(contenido).toContain('PEDIATRIA');
    });
  });

  it('no exporta cuando el filtro no contiene reportes', () => {
    componente.reportesFiltrados = [];
    const crearUrl = spyOn(URL, 'createObjectURL');

    componente.exportarCsv();

    expect(crearUrl).not.toHaveBeenCalled();
  });
});
