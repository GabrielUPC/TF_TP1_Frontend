import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../services/dashboard.service';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';
import { ArchivoService } from '../../services/archivo.service';
import { AuthService } from '../../services/auth.service';
import { DashboardDetalle } from '../../models/dashboard-detalle';

describe('DashboardComponent integrado', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let prediccion: jasmine.SpyObj<PrediccionBinariaService>;
  const observado: DashboardDetalle = {
    idIndicador: 1, idRegistro: 1, idArchivo: 1, nombreArchivo: 'D1.csv',
    anio: 2025, mes: 6, servicioHospitalario: 'MEDICINA', codigoIpress: '00006210',
    ingresos: 10, egresos: 8, estancias: 40, pacientesCama: 240,
    camasTotales: 10, totalCamasDisponibles: 300,
    ocupacionEstimada: .8, presionIngresosCamas: 1, promedioEstancia: 5, rotacionCamas: .8
  };
  const resumen = {
    totalRegistros: 1, totalPredicciones: 0, totalRiesgoBajo: 0,
    totalRiesgoMedio: 0, totalRiesgoAlto: 0, promedioOcupacionEstimada: .8,
    promedioPresionIngresosCamas: 1, promedioProbabilidadAltaPresion: 0,
    totalIngresos: 10, totalEgresos: 8, totalEstancias: 40,
    totalPacientesCama: 240, totalCamasDisponiblesHabilitadas: 0,
    totalDiasCamaDisponibles: 300, nivelRiesgoPredominante: 'SIN DATOS',
    mensajeResumen: 'Datos observados sin predicción.'
  };

  beforeEach(async () => {
    const dashboard = jasmine.createSpyObj('DashboardService',
      ['obtenerResumen', 'obtenerDetalle', 'obtenerAlertas', 'filtrar']);
    dashboard.obtenerResumen.and.returnValue(of(resumen));
    dashboard.obtenerDetalle.and.returnValue(of([observado]));
    dashboard.obtenerAlertas.and.returnValue(of([]));
    dashboard.filtrar.and.returnValue(of([observado]));
    prediccion = jasmine.createSpyObj('PrediccionBinariaService', ['obtenerCatalogo', 'predecir']);
    prediccion.obtenerCatalogo.and.returnValue(of({
      codigoIpress: '00006210', nombreIpress: 'Hospital',
      servicios: [{ servicio: 'MEDICINA', periodosDisponibles: ['2025-06'] }]
    }));
    prediccion.predecir.and.returnValue(of({
      probabilidad_alta_presion: .41, threshold: .36, alerta_alta_presion: true,
      nivel_riesgo: 'ALTO', descripcion_riesgo: 'Alta presión', umbral_bajo_medio: .20,
      codigo_ipress: '00006210', servicio_hospitalizacion: 'MEDICINA',
      periodo_actual: '2025-06', periodo_predicho: '2025-07',
      modelo: 'modelo_ipress_binario_v1'
    }));
    const archivo = jasmine.createSpyObj('ArchivoService', ['listarArchivosProcesados']);
    archivo.listarArchivosProcesados.and.returnValue(of([]));
    const auth = jasmine.createSpyObj('AuthService', ['obtenerUsuarioActual']);
    auth.obtenerUsuarioActual.and.returnValue({ ipressAsignada: 'Hospital' });
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboard },
        { provide: PrediccionBinariaService, useValue: prediccion },
        { provide: ArchivoService, useValue: archivo },
        { provide: AuthService, useValue: auth }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('muestra datos observados aunque aún no exista una predicción', () => {
    expect(fixture.componentInstance.detalle.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Datos observados');
    expect(fixture.nativeElement.textContent).toContain('SIN PREDICCIÓN');
  });

  it('usa un único filtro y no renderiza el componente binario separado', () => {
    expect(fixture.nativeElement.querySelectorAll('.filter-panel').length).toBe(1);
    expect(fixture.nativeElement.querySelector('app-prediccion-binaria')).toBeNull();
  });

  it('analiza solo un periodo publicado por el catálogo', () => {
    const c = fixture.componentInstance;
    c.servicioFiltro = 'MEDICINA'; c.anioFiltro = 2025; c.mesFiltro = 6;
    c.analizarPeriodo();
    expect(prediccion.predecir).toHaveBeenCalledOnceWith({
      servicio: 'MEDICINA', periodo_actual: '2025-06'
    });
    expect(c.resultado?.nivel_riesgo).toBe('ALTO');
  });

  it('distingue camas físicas de días-cama disponibles', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Camas totales');
    expect(texto).toContain('Días-cama disponibles');
  });
});
