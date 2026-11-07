import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReportesComponent } from './reportes.component';
import { Reporte } from '../../models/reporte';
import { ArchivoService } from '../../services/archivo.service';
import { ReporteService } from '../../services/reporte.service';

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

  describe('filtro de archivos con nombres repetidos', () => {
    let fixture: ComponentFixture<ReportesComponent>;
    let reporteService: jasmine.SpyObj<ReporteService>;

    const archivos = [1, 4].map((idArchivo) => ({
      idArchivo,
      nombreArchivo: 'ConsultaD1_2025_v20.csv',
      fechaCarga: '2025-01-01T00:00:00',
      formatoDetectado: 'DATASET_D1',
      registrosValidos: 1,
      prediccionesGeneradas: 1
    }));
    const reportes = [1, 4].map((idArchivo) => ({
      idReporte: idArchivo,
      idArchivo,
      nombreArchivo: 'ConsultaD1_2025_v20.csv',
      servicioHospitalario: 'MEDICINA',
      anio: 2025,
      mes: 6,
      nivelRiesgo: 'ALTO'
    } as Reporte));

    beforeEach(async () => {
      reporteService = jasmine.createSpyObj<ReporteService>('ReporteService', ['listarReportes', 'filtrarReportes']);
      const archivoService = jasmine.createSpyObj<ArchivoService>('ArchivoService', ['listarArchivosProcesados']);
      reporteService.listarReportes.and.returnValue(of(reportes));
      reporteService.filtrarReportes.and.callFake((filtros) => of(
        filtros.idArchivo === undefined ? reportes : reportes.filter((reporte) => reporte.idArchivo === filtros.idArchivo)
      ));
      archivoService.listarArchivosProcesados.and.returnValue(of(archivos));
      await TestBed.configureTestingModule({
        imports: [ReportesComponent],
        providers: [
          { provide: ReporteService, useValue: reporteService },
          { provide: ArchivoService, useValue: archivoService }
        ]
      }).compileComponents();
      fixture = TestBed.createComponent(ReportesComponent);
      fixture.detectChanges();
    });

    function seleccionar(indice: number): void {
      const select = fixture.nativeElement.querySelector('#archivoReporte') as HTMLSelectElement;
      select.value = select.options[indice].value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    it('distingue ambos archivos en el desplegable y conserva el ID numérico', () => {
      const opciones = (fixture.nativeElement.querySelector('#archivoReporte') as HTMLSelectElement).options;
      expect(opciones[2].textContent?.trim()).toBe('ConsultaD1_2025_v20.csv (ID 1)');
      expect(opciones[3].textContent?.trim()).toBe('ConsultaD1_2025_v20.csv (ID 4)');

      seleccionar(2);
      expect(fixture.componentInstance.seleccionArchivo).toBe(1);
      expect(fixture.componentInstance.idArchivoFiltro).toBe(1);
      expect(fixture.nativeElement.querySelector('.file-context strong').textContent.trim()).toBe('ConsultaD1_2025_v20.csv (ID 1)');

      seleccionar(3);
      expect(fixture.componentInstance.seleccionArchivo).toBe(4);
      expect(fixture.componentInstance.idArchivoFiltro).toBe(4);
    });

    it('filtra por ID, conserva el ultimo archivo y limpia los filtros', () => {
      seleccionar(3);
      const componente = fixture.componentInstance;
      componente.anioFiltro = 2025;
      componente.mesFiltro = 6;
      componente.servicioFiltro = ' MEDICINA ';
      componente.filtroRiesgo = 'ALTO';
      componente.aplicarFiltros();
      fixture.detectChanges();

      expect(reporteService.filtrarReportes).toHaveBeenCalledWith({
        idArchivo: 4, anio: 2025, mes: 6, servicioHospitalario: 'MEDICINA', nivelRiesgo: 'ALTO'
      });
      expect(componente.reportesFiltrados.map((reporte) => reporte.idArchivo)).toEqual([4]);
      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
      expect(fixture.nativeElement.querySelector('tbody tr').textContent).toContain('ID 4');

      seleccionar(1);
      expect(componente.idArchivoFiltro).toBe(1);
      componente.limpiarFiltros();
      fixture.detectChanges();
      expect(componente.seleccionArchivo).toBe('TODOS');
      expect(componente.idArchivoFiltro).toBeNull();
      expect(componente.anioFiltro).toBeNull();
      expect(componente.mesFiltro).toBeNull();
      expect(componente.servicioFiltro).toBe('');
      expect(componente.filtroRiesgo).toBe('TODOS');
      expect(componente.reportesFiltrados.length).toBe(2);
      expect(reporteService.filtrarReportes).toHaveBeenCalledWith({
        idArchivo: undefined, anio: undefined, mes: undefined,
        servicioHospitalario: undefined, nivelRiesgo: 'TODOS'
      });
    });

    it('exporta solo los reportes del ID seleccionado', async () => {
      seleccionar(2);
      fixture.componentInstance.aplicarFiltros();
      fixture.detectChanges();
      const crearUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:cp033');
      spyOn(URL, 'revokeObjectURL');
      spyOn(HTMLAnchorElement.prototype, 'click');

      fixture.componentInstance.exportarCsv();

      const contenido = await (crearUrl.calls.mostRecent().args[0] as Blob).text();
      expect(contenido).toContain('"1"');
      expect(contenido).not.toContain('"4"');
    });
  });
});
