import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { DashboardDetalle } from '../../models/dashboard-detalle';
import { DashboardResumen } from '../../models/dashboard-resumen';
import { of, Subject, throwError } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';
import { ArchivoService } from '../../services/archivo.service';
import { AuthService } from '../../services/auth.service';
import { PrediccionBinariaAutomaticaResponse } from '../../models/prediccion-binaria';

describe('DashboardComponent - indicadores no calculables', () => {
  let component: DashboardComponent;

  beforeEach(() => {
    component = new DashboardComponent({} as never, {} as never, {} as never, {} as never);
  });

  for (const valor of [null, undefined, Number.NaN]) {
    it(`muestra N/D para ocupación no disponible: ${String(valor)}`, () => {
      expect(component.formatearPorcentaje(valor)).toBe('N/D');
    });

    it(`muestra N/D para presión no disponible: ${String(valor)}`, () => {
      expect(component.formatearNumero(valor, 2)).toBe('N/D');
    });

    it(`muestra N/D para promedio de estancia no disponible: ${String(valor)}`, () => {
      expect(component.formatearDias(valor)).toBe('N/D');
    });
  }

  it('conserva cero como valor válido en los tres indicadores', () => {
    expect(component.formatearPorcentaje(0)).toBe('0.0%');
    expect(component.formatearNumero(0, 2)).toBe('0');
    expect(component.formatearDias(0)).toBe('0 días');
  });

  for (const valor of [null, undefined, Number.NaN]) {
    it(`marca como NO EVALUABLE las acciones con indicadores ${String(valor)}`, () => {
      component.detalle = [detalle({
        ocupacionEstimada: valor,
        presionIngresosCamas: valor,
        promedioEstancia: valor
      })];

      const acciones = component.accionesSugeridas;

      expect(acciones.find(a => a.indicador === 'Porcentaje de ocupación'))
        .toEqual(jasmine.objectContaining({ valor: 'N/D', prioridad: 'NO EVALUABLE' }));
      expect(acciones.find(a => a.indicador === 'Presión ingresos/camas'))
        .toEqual(jasmine.objectContaining({ valor: 'N/D', prioridad: 'NO EVALUABLE' }));
      expect(acciones.find(a => a.indicador === 'Promedio de estancia'))
        .toEqual(jasmine.objectContaining({ valor: 'N/D', prioridad: 'NO EVALUABLE' }));
    });
  }

  it('evalúa como datos válidos los ceros de los tres indicadores', () => {
    component.detalle = [detalle({
      ocupacionEstimada: 0,
      presionIngresosCamas: 0,
      promedioEstancia: 0
    })];

    const acciones = component.accionesSugeridas;

    expect(acciones.find(a => a.indicador === 'Porcentaje de ocupación'))
      .toEqual(jasmine.objectContaining({ valor: '0.0%', prioridad: 'BAJA' }));
    expect(acciones.find(a => a.indicador === 'Presión ingresos/camas'))
      .toEqual(jasmine.objectContaining({ valor: '0', prioridad: 'BAJA' }));
    expect(acciones.find(a => a.indicador === 'Promedio de estancia'))
      .toEqual(jasmine.objectContaining({ valor: '0 días', prioridad: 'BAJA' }));
  });
});

function detalle(cambios: Partial<DashboardDetalle>): DashboardDetalle {
  return {
    idIndicador: 1, idRegistro: 1, idArchivo: 1, nombreArchivo: 'D1.csv',
    anio: 2025, mes: 1, servicioHospitalario: 'HOSPITALIZACIÓN', codigoIpress: '00000001',
    ingresos: 0, egresos: 0, estancias: 0, pacientesCama: 0,
    camasTotales: 10, totalCamasDisponibles: 300,
    ocupacionEstimada: 0, presionIngresosCamas: 0,
    promedioEstancia: 0, rotacionCamas: 0,
    ...cambios
  };
}

describe('DashboardComponent - consulta observacional CP026', () => {
  let component: DashboardComponent;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let prediccionService: jasmine.SpyObj<PrediccionBinariaService>;
  const registroCp026 = detalle({
    idArchivo: 45, nombreArchivo: 'd1_dashboard_junio_2025.csv',
    anio: 2025, mes: 6, servicioHospitalario: 'MEDICINA',
    ingresos: 20, egresos: 18, estancias: 120, pacientesCama: 240,
    camasTotales: 10, totalCamasDisponibles: 300,
    camasDisponiblesHabilitadas: null, idPrediccion: null
  });
  const otroRegistro = detalle({ idArchivo: 46, totalCamasDisponibles: 6572 });

  beforeEach(() => {
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService',
      ['obtenerResumen', 'obtenerDetalle', 'obtenerAlertas', 'filtrar']);
    prediccionService = jasmine.createSpyObj<PrediccionBinariaService>('PrediccionBinariaService',
      ['obtenerCatalogo', 'predecir']);
    const archivoService = jasmine.createSpyObj<ArchivoService>('ArchivoService',
      ['listarArchivosProcesados']);
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['obtenerUsuarioActual']);

    dashboardService.obtenerResumen.and.returnValue(of({} as DashboardResumen));
    dashboardService.obtenerDetalle.and.callFake(id =>
      of(id === 45 ? [registroCp026] : id === 46 ? [otroRegistro] : [registroCp026, otroRegistro]));
    dashboardService.obtenerAlertas.and.returnValue(of([]));
    prediccionService.obtenerCatalogo.and.returnValue(of({
      codigoIpress: '00007636', nombreIpress: 'IPRESS QA SINTETICA', servicios: []
    }));
    archivoService.listarArchivosProcesados.and.returnValue(of([]));
    authService.obtenerUsuarioActual.and.returnValue(null);

    component = new DashboardComponent(dashboardService, prediccionService,
      archivoService, authService);
    component.cargarDashboard();
  });

  it('aísla el archivo y conserva camas físicas nulas sin solicitar predicción', () => {
    expect(component.totalDiasCama).toBe(6872);

    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();

    expect(dashboardService.obtenerDetalle).toHaveBeenCalledWith(45);
    expect(component.totalDiasCama).toBe(300);
    expect(component.totalIngresos).toBe(20);
    expect(component.totalEgresos).toBe(18);
    expect(component.totalEstancias).toBe(120);
    expect(component.totalPacientesCama).toBe(240);
    expect(component.totalCamas).toBe(10);
    expect(component.registroSeleccionado?.servicioHospitalario).toBe('MEDICINA');
    expect(component.registroSeleccionado?.mes).toBe(6);
    expect(component.registroSeleccionado?.camasDisponiblesHabilitadas).toBeNull();
    expect(component.formatearNumero(component.registroSeleccionado?.camasDisponiblesHabilitadas)).toBe('N/D');
    expect(component.registroSeleccionado?.idPrediccion).toBeNull();
    expect(component.barrasIngresos[0].valor).toBe(20);
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });

  it('restaura la vista general al limpiar', () => {
    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    component.limpiarFiltros();

    expect(component.idArchivoFiltro).toBeNull();
    expect(component.totalDiasCama).toBe(6872);
    expect(component.detalle.length).toBe(2);
  });

  it('descarta una respuesta antigua cuando se elige otro archivo', () => {
    const primera = new Subject<DashboardDetalle[]>();
    const segunda = new Subject<DashboardDetalle[]>();
    dashboardService.obtenerDetalle.and.callFake(id =>
      id === 45 ? primera.asObservable() : id === 46 ? segunda.asObservable()
        : of([registroCp026, otroRegistro]));

    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    component.idArchivoFiltro = 46;
    component.consultarArchivoObservado();

    segunda.next([otroRegistro]);
    segunda.complete();
    primera.next([registroCp026]);
    primera.complete();

    expect(component.idArchivoFiltro).toBe(46);
    expect(component.totalDiasCama).toBe(6572);
    expect(component.registroSeleccionado?.idArchivo).toBe(46);
  });

  it('limpia los datos previos cuando el archivo está vacío o falla HTTP', () => {
    dashboardService.obtenerDetalle.and.callFake(id =>
      id === 46 ? of([]) : id === 45 ? throwError(() => new Error('HTTP 500'))
        : of([registroCp026, otroRegistro]));

    component.idArchivoFiltro = 46;
    component.consultarArchivoObservado();
    expect(component.detalle).toEqual([]);
    expect(component.registroSeleccionado).toBeNull();

    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    expect(component.detalle).toEqual([]);
    expect(component.error).toContain('No se pudo cargar');
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });

  it('mantiene la validación predictiva cuando no hay ventana', () => {
    component.servicioFiltro = 'MEDICINA';
    component.anioFiltro = 2025;
    component.mesFiltro = 6;
    component.analizarPeriodo();

    expect(component.error).toContain('seis meses consecutivos');
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });
});

describe('DashboardComponent - estado vacio CP024', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let prediccionService: jasmine.SpyObj<PrediccionBinariaService>;

  beforeEach(async () => {
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService',
      ['obtenerResumen', 'obtenerDetalle', 'obtenerAlertas', 'filtrar']);
    prediccionService = jasmine.createSpyObj<PrediccionBinariaService>('PrediccionBinariaService',
      ['obtenerCatalogo', 'predecir']);
    const archivoService = jasmine.createSpyObj<ArchivoService>('ArchivoService',
      ['listarArchivosProcesados']);
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['obtenerUsuarioActual']);

    dashboardService.obtenerResumen.and.returnValue(of({} as DashboardResumen));
    dashboardService.obtenerDetalle.and.returnValue(of([]));
    dashboardService.obtenerAlertas.and.returnValue(of([]));
    prediccionService.obtenerCatalogo.and.returnValue(of({
      codigoIpress: '00007636', nombreIpress: 'IPRESS QA SINTETICA', servicios: []
    }));
    archivoService.listarArchivosProcesados.and.returnValue(of([]));
    authService.obtenerUsuarioActual.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: PrediccionBinariaService, useValue: prediccionService },
        { provide: ArchivoService, useValue: archivoService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  function comprobarEstadoVacio(mensaje: string): void {
    const vista = fixture.nativeElement as HTMLElement;
    expect(vista.querySelector('.empty-state strong')?.textContent?.trim())
      .toBe('No hay datos observados para mostrar');
    expect(vista.querySelector('.empty-state span')?.textContent?.trim()).toBe(mensaje);
    expect(vista.querySelector('.kpi-card')).toBeNull();
    expect(vista.querySelector('.observed-charts')).toBeNull();
    expect(fixture.componentInstance.registroSeleccionado).toBeNull();
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  }

  it('muestra los mensajes literales de la vista general sin registros', () => {
    expect(dashboardService.obtenerDetalle).toHaveBeenCalledWith(undefined);
    comprobarEstadoVacio('Carga información hospitalaria válida o limpia los filtros.');
  });

  it('mantiene el mensaje específico de un archivo seleccionado sin registros', () => {
    fixture.componentInstance.idArchivoFiltro = 45;
    fixture.componentInstance.consultarArchivoObservado();
    fixture.detectChanges();

    expect(dashboardService.obtenerDetalle).toHaveBeenCalledWith(45);
    comprobarEstadoVacio(
      'Este archivo no tiene registros observados disponibles. Selecciona otro archivo o pulsa Limpiar.'
    );
  });
});

describe('DashboardComponent - archivos observados con nombres repetidos', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let prediccionService: jasmine.SpyObj<PrediccionBinariaService>;

  beforeEach(async () => {
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService',
      ['obtenerResumen', 'obtenerDetalle', 'obtenerAlertas', 'filtrar']);
    prediccionService = jasmine.createSpyObj<PrediccionBinariaService>('PrediccionBinariaService',
      ['obtenerCatalogo', 'predecir']);
    const archivoService = jasmine.createSpyObj<ArchivoService>('ArchivoService',
      ['listarArchivosProcesados']);
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['obtenerUsuarioActual']);
    const archivos = [1, 4].map(idArchivo => ({
      idArchivo, nombreArchivo: 'ConsultaD1_2025_v20.csv',
      fechaCarga: '2025-01-01T00:00:00', formatoDetectado: 'DATASET_D1',
      registrosValidos: 1, prediccionesGeneradas: 1
    }));
    const registros = [
      detalle({ idArchivo: 1, nombreArchivo: archivos[0].nombreArchivo, ingresos: 10 }),
      detalle({ idArchivo: 4, nombreArchivo: archivos[1].nombreArchivo, ingresos: 20 })
    ];

    dashboardService.obtenerResumen.and.returnValue(of({} as DashboardResumen));
    dashboardService.obtenerDetalle.and.callFake(idArchivo => of(
      idArchivo === undefined ? registros : registros.filter(item => item.idArchivo === idArchivo)
    ));
    dashboardService.obtenerAlertas.and.returnValue(of([]));
    prediccionService.obtenerCatalogo.and.returnValue(of({
      codigoIpress: '00007636', nombreIpress: 'IPRESS QA SINTETICA', servicios: []
    }));
    archivoService.listarArchivosProcesados.and.returnValue(of(archivos));
    authService.obtenerUsuarioActual.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: PrediccionBinariaService, useValue: prediccionService },
        { provide: ArchivoService, useValue: archivoService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('diferencia nombres iguales y consulta cada archivo por su ID numérico', () => {
    const select = (fixture.nativeElement as HTMLElement).querySelector('#archivoFiltro') as HTMLSelectElement;
    expect(select.options[1].textContent?.trim()).toBe('ConsultaD1_2025_v20.csv (ID 1)');
    expect(select.options[2].textContent?.trim()).toBe('ConsultaD1_2025_v20.csv (ID 4)');

    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.idArchivoFiltro).toBe(1);
    expect(dashboardService.obtenerDetalle).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.totalIngresos).toBe(10);

    select.value = select.options[2].value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.idArchivoFiltro).toBe(4);
    expect(dashboardService.obtenerDetalle).toHaveBeenCalledWith(4);
    expect(fixture.componentInstance.totalIngresos).toBe(20);
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });
});

describe('DashboardComponent - tendencia observada CP029', () => {
  let component: DashboardComponent;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let prediccionService: jasmine.SpyObj<PrediccionBinariaService>;
  const serie = [80, 82, 84, 86, 88, 92].map((porcentaje, indice) => detalle({
    idArchivo: 45, idRegistro: indice + 1, anio: 2025, mes: indice + 1,
    servicioHospitalario: 'MEDICINA', pacientesCama: porcentaje,
    totalCamasDisponibles: 100, ocupacionEstimada: porcentaje / 100
  }));
  const registros = [
    detalle({ idArchivo: 45, anio: 2016, mes: 12, servicioHospitalario: 'MEDICINA',
      pacientesCama: 80, totalCamasDisponibles: 100 }),
    ...serie,
    detalle({ idArchivo: 45, anio: 2024, mes: 12, servicioHospitalario: 'MEDICINA',
      pacientesCama: 70, totalCamasDisponibles: 100 }),
    detalle({ idArchivo: 45, anio: 2025, mes: 6, servicioHospitalario: 'CIRUGÍA',
      pacientesCama: 40, totalCamasDisponibles: 100 }),
    detalle({ idArchivo: 46, anio: 2025, mes: 6, servicioHospitalario: 'MEDICINA',
      pacientesCama: 25, totalCamasDisponibles: 100 })
  ];

  beforeEach(() => {
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService',
      ['obtenerResumen', 'obtenerDetalle', 'obtenerAlertas', 'filtrar']);
    prediccionService = jasmine.createSpyObj<PrediccionBinariaService>('PrediccionBinariaService',
      ['obtenerCatalogo', 'predecir']);
    const archivoService = jasmine.createSpyObj<ArchivoService>('ArchivoService',
      ['listarArchivosProcesados']);
    const authService = jasmine.createSpyObj<AuthService>('AuthService', ['obtenerUsuarioActual']);
    dashboardService.obtenerResumen.and.returnValue(of({} as DashboardResumen));
    dashboardService.obtenerDetalle.and.callFake(id => of(
      id === undefined ? registros : registros.filter(item => item.idArchivo === id)
    ));
    dashboardService.obtenerAlertas.and.returnValue(of([]));
    prediccionService.obtenerCatalogo.and.returnValue(of({
      codigoIpress: '00007636', nombreIpress: 'IPRESS QA SINTETICA', servicios: []
    }));
    archivoService.listarArchivosProcesados.and.returnValue(of([]));
    authService.obtenerUsuarioActual.and.returnValue(null);
    component = new DashboardComponent(dashboardService, prediccionService,
      archivoService, authService);
    component.cargarDashboard();
  });

  it('muestra seis meses de 2025 y promedio 85.3% sin predecir ni usar diciembre de 2016', () => {
    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    component.servicioFiltro = 'MEDICINA';
    component.alCambiarServicio();
    component.anioFiltro = 2025;
    component.alCambiarAnio();
    component.mesFiltro = 6;
    component.alCambiarMes();

    expect(component.puntosOcupacion.map(p => p.periodo))
      .toEqual(['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06']);
    expect(component.puntosOcupacion.map(p => component.formatearPorcentaje(p.valor)))
      .toEqual(['80.0%', '82.0%', '84.0%', '86.0%', '88.0%', '92.0%']);
    expect(component.formatearPorcentaje(component.promedioOcupacionTendencia)).toBe('85.3%');
    expect(component.yUmbralOcupacion).toBeGreaterThan(0);
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });

  it('cambia servicio, año y mes sin conservar la tendencia anterior', () => {
    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    component.servicioFiltro = 'MEDICINA';
    component.alCambiarServicio();
    component.anioFiltro = 2025;
    component.alCambiarAnio();
    component.mesFiltro = 6;
    component.alCambiarMes();

    component.mesFiltro = 5;
    component.alCambiarMes();
    expect(component.puntosOcupacion.map(p => p.periodo))
      .toEqual(['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05']);

    component.anioFiltro = 2016;
    component.alCambiarAnio();
    expect(component.puntosOcupacion.map(p => p.periodo)).toEqual(['2016-12']);

    component.servicioFiltro = 'CIRUGÍA';
    component.alCambiarServicio();
    expect(component.puntosOcupacion.map(p => p.periodo)).toEqual(['2025-06']);
    expect(component.formatearPorcentaje(component.puntosOcupacion[0].valor)).toBe('40.0%');
  });

  it('aísla el archivo seleccionado y limpia una selección sin registros', () => {
    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    expect(component.puntosOcupacion.some(p => p.valor === .25)).toBeFalse();

    component.idArchivoFiltro = 46;
    component.consultarArchivoObservado();
    expect(component.puntosOcupacion.map(p => p.periodo)).toEqual(['2025-06']);
    expect(component.formatearPorcentaje(component.puntosOcupacion[0].valor)).toBe('25.0%');

    component.idArchivoFiltro = 99;
    component.consultarArchivoObservado();
    expect(component.puntosOcupacion).toEqual([]);
    expect(component.barrasIngresos).toEqual([]);
    expect(component.registroSeleccionado).toBeNull();
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });

  it('rechaza una predicción sin ventana válida sin borrar la observación', () => {
    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    component.servicioFiltro = 'MEDICINA';
    component.alCambiarServicio();
    component.anioFiltro = 2025;
    component.alCambiarAnio();
    component.mesFiltro = 6;
    component.alCambiarMes();
    component.analizarPeriodo();

    expect(component.error).toContain('seis meses consecutivos');
    expect(component.puntosOcupacion.length).toBe(6);
    expect(prediccionService.predecir).not.toHaveBeenCalled();
  });

  it('descarta respuestas observacionales antiguas tras cambiar de archivo', () => {
    const primera = new Subject<DashboardDetalle[]>();
    const segunda = new Subject<DashboardDetalle[]>();
    dashboardService.obtenerDetalle.and.callFake(id =>
      id === 45 ? primera.asObservable() : id === 46 ? segunda.asObservable() : of(registros)
    );
    component.idArchivoFiltro = 45;
    component.consultarArchivoObservado();
    component.idArchivoFiltro = 46;
    component.consultarArchivoObservado();
    segunda.next(registros.filter(item => item.idArchivo === 46));
    segunda.complete();
    primera.next(registros.filter(item => item.idArchivo === 45));
    primera.complete();

    expect(component.idArchivoFiltro).toBe(46);
    expect(component.puntosOcupacion.map(p => p.periodo)).toEqual(['2025-06']);
    expect(component.formatearPorcentaje(component.puntosOcupacion[0].valor)).toBe('25.0%');
  });

  it('ignora una predicción tardía tras cambiar de servicio', () => {
    const prediccionPendiente = new Subject<PrediccionBinariaAutomaticaResponse>();
    prediccionService.predecir.and.returnValue(prediccionPendiente.asObservable());
    component.catalogo = {
      codigoIpress: '00007636', nombreIpress: 'IPRESS QA SINTETICA',
      servicios: [{ servicio: 'MEDICINA', periodosDisponibles: ['2025-06'] }]
    };
    component.servicioFiltro = 'MEDICINA';
    component.alCambiarServicio();
    component.anioFiltro = 2025;
    component.alCambiarAnio();
    component.mesFiltro = 6;
    component.alCambiarMes();
    component.analizarPeriodo();

    component.servicioFiltro = 'CIRUGÍA';
    component.alCambiarServicio();
    prediccionPendiente.next({} as PrediccionBinariaAutomaticaResponse);
    prediccionPendiente.complete();

    expect(component.resultado).toBeNull();
    expect(component.puntosOcupacion.map(p => p.periodo)).toEqual(['2025-06']);
    expect(component.formatearPorcentaje(component.puntosOcupacion[0].valor)).toBe('40.0%');
    expect(dashboardService.filtrar).not.toHaveBeenCalled();
  });
});
