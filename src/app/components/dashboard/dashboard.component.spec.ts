import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AlertasComponent } from '../alertas/alertas.component';
import { DashboardService } from '../../services/dashboard.service';
import { ArchivoService } from '../../services/archivo.service';
import { AuthService } from '../../services/auth.service';
import { DashboardDetalle } from '../../models/dashboard-detalle';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';

function registro(cambios: Partial<DashboardDetalle> = {}): DashboardDetalle {
  return {
    idPrediccion: 1, idIndicador: 2, idRegistro: 3, idArchivo: 4, nombreArchivo: 'datos.csv',
    anio: 2026, mes: 3, servicioHospitalario: 'Medicina', codigoIpress: '001',
    ingresos: 20, egresos: 10, estancias: 40, pacientesCama: 240,
    camasTotales: 10, camasDisponiblesHabilitadas: 10, totalCamasDisponibles: 300,
    ocupacionEstimada: .8, presionIngresosCamas: 2, promedioEstancia: 4, rotacionCamas: 1,
    nivelRiesgo: 'MEDIO', probabilidad: .30,
    probabilidadRiesgoBajo: .45, probabilidadRiesgoMedio: .30, probabilidadRiesgoAlto: .25,
    riesgoInsuficienciaCapacidad: null, modeloUtilizado: 'XGBoost - FastAPI',
    fechaPrediccion: '2026-04-01T00:00:00', alerta: 'Preventiva', interpretacion: '', ...cambios
  };
}

describe('Contrato predictivo recibido: dashboard y alertas', () => {
  let servicio: jasmine.SpyObj<DashboardService>;
  let archivoService: jasmine.SpyObj<ArchivoService>;
  let prediccionService: jasmine.SpyObj<PrediccionBinariaService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('DashboardService', [
      'filtrar', 'obtenerAlertas', 'obtenerResumen', 'obtenerDetalle'
    ]);
    servicio.filtrar.and.returnValue(of([registro()]));
    servicio.obtenerAlertas.and.returnValue(of([registro(), registro({nivelRiesgo: 'ALTO'})]));
    servicio.obtenerResumen.and.returnValue(of({
      totalPredicciones: 1,
      totalRiesgoBajo: 0,
      totalRiesgoMedio: 1,
      totalRiesgoAlto: 0,
      promedioOcupacionEstimada: .8,
      promedioPresionIngresosCamas: 2,
      promedioProbabilidad: .3,
      totalIngresos: 20,
      totalEgresos: 10,
      totalEstancias: 40,
      totalPacientesCama: 240,
      totalCamasDisponiblesHabilitadas: 300,
      nivelRiesgoPredominante: 'MEDIO',
      mensajeResumen: ''
    }));
    servicio.obtenerDetalle.and.returnValue(of([registro()]));
    archivoService = jasmine.createSpyObj('ArchivoService', ['listarArchivosProcesados']);
    archivoService.listarArchivosProcesados.and.returnValue(of([]));
    prediccionService = jasmine.createSpyObj('PrediccionBinariaService', ['obtenerCatalogo', 'predecir']);
    prediccionService.obtenerCatalogo.and.returnValue(of([registro({ anio: 2025, mes: 6 })]));
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, AlertasComponent],
      providers: [
        {provide: DashboardService, useValue: servicio},
        {provide: ArchivoService, useValue: archivoService},
        {provide: PrediccionBinariaService, useValue: prediccionService},
        {provide: AuthService, useValue: {obtenerUsuarioActual: () => null}}
      ]
    }).compileComponents();
  });

  function dashboard(fila = registro()) {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.detalle = [fila];
    fixture.componentInstance.alertas = [fila].filter((item) => {
      const nivel = item.nivelRiesgo?.toUpperCase();
      return nivel === 'MEDIO' || nivel === 'ALTO';
    });
    fixture.detectChanges();
    return fixture;
  }

  it('integra la predicción binaria dentro del dashboard sin ejecutarla automáticamente', () => {
    const fixture = dashboard();
    expect(fixture.nativeElement.querySelector('app-prediccion-binaria')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#binary-ipress')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.filter-panel')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Predicción de riesgo hospitalario');
    expect(fixture.nativeElement.textContent).toContain('Explora la información asistencial');
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });

  it('muestra MEDIO y la probabilidad final aunque Bajo sea la clase más probable', () => {
    const fila = registro();
    const original = JSON.stringify(fila);
    const fixture = dashboard(fila);
    expect(fixture.nativeElement.querySelector('.risk-level').textContent.trim()).toBe('MEDIO');
    const texto = fixture.nativeElement.querySelector('.risk-context').textContent;
    expect(texto).toContain('Probabilidad de la clase predicha');
    expect(texto).toContain('30.0%');
    expect(texto).toContain('Probabilidad de riesgo Alto');
    expect(texto).toContain('25.0%');
    expect(JSON.stringify(fila)).toBe(original);
  });

  for (const nivel of ['BAJO', 'MEDIO', 'ALTO']) {
    it(`no reclasifica ${nivel} por ocupación ni probabilidades`, () => {
      const fixture = dashboard(registro({nivelRiesgo: nivel, ocupacionEstimada: 10,
        probabilidadRiesgoAlto: .99, probabilidad: .01}));
      expect(fixture.nativeElement.querySelector('.risk-level').textContent.trim()).toBe(nivel);
    });
  }

  it('índice ausente muestra N/D sin fabricar marcador desde la confianza', () => {
    const fixture = dashboard(registro({nivelRiesgo: 'ALTO', probabilidad: .99}));
    expect(fixture.componentInstance.riesgoInsuficienciaCapacidad).toBeNull();
    expect(fixture.nativeElement.querySelector('.probability-block').textContent).toContain('N/D');
    expect(fixture.nativeElement.querySelector('.scale-track i')).toBeNull();
  });

  it('conserva el índice operativo recibido sin recalcularlo', () => {
    const fixture = dashboard(registro({riesgoInsuficienciaCapacidad: .58}));
    expect(fixture.componentInstance.riesgoInsuficienciaCapacidad).toBe(.58);
    expect(fixture.componentInstance.probabilidadCritica).toBeCloseTo(58);
    expect(fixture.nativeElement.querySelector('.probability-block').textContent).toContain('Índice operativo');
  });

  it('probabilidades ausentes o inválidas no se muestran como cero, null o NaN', () => {
    const fixture = dashboard(registro({probabilidad: null, probabilidadRiesgoAlto: null}));
    const texto = fixture.nativeElement.querySelector('.risk-context').textContent;
    expect(texto).toContain('N/D');
    expect(texto).not.toMatch(/undefined|null|NaN/);
    for (const valor of [null, undefined, NaN, Infinity, -1, 2]) {
      expect(fixture.componentInstance.formatearProbabilidad(valor)).toBe('N/D');
    }
    expect(fixture.componentInstance.formatearProbabilidad(0)).toBe('0.0%');
  });

  it('mantiene filtros y alertas derivados del nivel recibido', () => {
    const fixture = dashboard();
    const c = fixture.componentInstance;
    c.idArchivoFiltro = 4; c.anioFiltro = 2026; c.mesFiltro = 3; c.servicioFiltro = 'Medicina';
    c.filtrarDashboard();
    expect(servicio.filtrar).toHaveBeenCalledWith(4, 2026, 3, 'Medicina');
    expect(c.detalle[0].nivelRiesgo).toBe('MEDIO');
    expect(c.alertas.length).toBe(1);
    expect(c.cargando).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.filter-field select').length).toBe(4);
  });

  it('alertas preserva MEDIO/ALTO y muestra probabilidad final y Alto independientes', () => {
    const fixture = TestBed.createComponent(AlertasComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.contarRiesgoMedio()).toBe(1);
    expect(c.contarRiesgoAlto()).toBe(1);
    expect(c.obtenerClaseRiesgo('MEDIO')).toBe('badge-medio');
    expect(c.obtenerClaseRiesgo('ALTO')).toBe('badge-alto');
    expect(fixture.nativeElement.textContent).toContain('30.00%');
    expect(fixture.nativeElement.textContent).toContain('25.00%');
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'MEDIO'; select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(c.alertasFiltradas.map(a => a.nivelRiesgo)).toEqual(['MEDIO']);
    for (const valor of [null, undefined, NaN]) expect(c.formatearProbabilidad(valor)).toBe('N/D');
  });
});
