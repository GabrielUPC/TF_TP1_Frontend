import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { DashboardDetalle } from '../../models/dashboard-detalle';
import { PrediccionBinariaAutomaticaResponse } from '../../models/prediccion-binaria';
import { AuthService } from '../../services/auth.service';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';
import { PrediccionBinariaComponent } from './prediccion-binaria.component';

function fila(servicio: string, cambios: Partial<DashboardDetalle> = {}): DashboardDetalle {
  return {
    idPrediccion: 1, idIndicador: 2, idRegistro: 3, idArchivo: 4, nombreArchivo: 'datos.csv',
    anio: 2025, mes: 6, servicioHospitalario: servicio, codigoIpress: '00006210',
    ingresos: 1, egresos: 1, estancias: 1, pacientesCama: 1, camasTotales: 1,
    camasDisponiblesHabilitadas: 30, ocupacionEstimada: .5, presionIngresosCamas: 1,
    promedioEstancia: 1, rotacionCamas: 1, nivelRiesgo: 'BAJO', probabilidad: .8,
    modeloUtilizado: 'legacy', fechaPrediccion: '2025-07-01', alerta: '', interpretacion: '',
    ...cambios
  };
}

function respuesta(cambios: Partial<PrediccionBinariaAutomaticaResponse> = {}): PrediccionBinariaAutomaticaResponse {
  return {
    probabilidad_alta_presion: 0.011501847766339779,
    threshold: 0.36,
    alerta_alta_presion: false,
    nivel_riesgo: 'BAJO',
    descripcion_riesgo: 'Probabilidad reducida de superar 90% de ocupación el siguiente periodo.',
    umbral_bajo_medio: 0.20,
    codigo_ipress: '00006210',
    servicio_hospitalizacion: 'HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA',
    periodo_actual: '2025-06',
    periodo_predicho: '2025-07',
    modelo: 'modelo_ipress_binario_v1',
    ...cambios
  };
}

describe('PrediccionBinariaComponent', () => {
  let fixture: ComponentFixture<PrediccionBinariaComponent>;
  let component: PrediccionBinariaComponent;
  let service: jasmine.SpyObj<PrediccionBinariaService>;

  const catalogo = [
    fila('HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA'),
    fila('HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA', { idRegistro: 5 }),
    fila('CUIDADOS INTENSIVOS', { idRegistro: 6 })
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj('PrediccionBinariaService', ['obtenerCatalogo', 'predecir']);
    service.obtenerCatalogo.and.returnValue(of(catalogo));
    service.predecir.and.returnValue(of(respuesta()));
    await TestBed.configureTestingModule({
      imports: [PrediccionBinariaComponent],
      providers: [
        { provide: PrediccionBinariaService, useValue: service },
        { provide: AuthService, useValue: { obtenerUsuarioActual: () => ({ nombreIpress: 'Hospital de prueba' }) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(PrediccionBinariaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function completarFormulario(): void {
    component.codigoIpress = '00006210';
    component.actualizarServicios();
    component.servicio = 'HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA';
    component.periodoActual = '2025-06';
  }

  function ejecutar(cambios: Partial<PrediccionBinariaAutomaticaResponse> = {}): void {
    service.predecir.and.returnValue(of(respuesta(cambios)));
    completarFormulario();
    component.predecir();
    fixture.detectChanges();
  }

  it('renderiza el formulario mínimo', () => {
    expect(fixture.nativeElement.querySelector('#binary-ipress')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#binary-service')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#binary-period')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.predict-button')).not.toBeNull();
  });

  it('carga el catálogo al iniciar', () => {
    expect(service.obtenerCatalogo).toHaveBeenCalledTimes(1);
    expect(component.errorCatalogo).toBe('');
  });

  it('elimina IPRESS duplicadas y conserva el código RENIPRESS', () => {
    expect(component.ipresses).toEqual([{ codigo: '00006210', etiqueta: 'Hospital de prueba (00006210)' }]);
    expect(component.codigoIpress).toBe('00006210');
  });

  it('selecciona automáticamente la única IPRESS asignada', () => {
    const select = fixture.nativeElement.querySelector('#binary-ipress') as HTMLSelectElement;
    expect(select.value).toBe('00006210');
  });

  it('carga servicios desde el catálogo sin duplicarlos', () => {
    expect(component.servicios).toEqual(['CUIDADOS INTENSIVOS', 'HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA']);
    expect(fixture.nativeElement.querySelectorAll('#binary-service option').length).toBe(3);
  });

  it('usa un selector de mes sin solicitar día', () => {
    const periodo = fixture.nativeElement.querySelector('#binary-period') as HTMLInputElement;
    expect(periodo.type).toBe('month');
  });

  it('envía exactamente IPRESS, servicio y periodo actual', () => {
    completarFormulario();
    component.predecir();
    expect(service.predecir).toHaveBeenCalledOnceWith({
      co_ipress: '00006210',
      servicio: 'HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA',
      periodo_actual: '2025-06'
    });
  });

  it('presenta la probabilidad como porcentaje con dos decimales', () => {
    ejecutar();
    const texto = fixture.nativeElement.querySelector('.probability-summary').textContent.replace(',', '.');
    expect(texto).toMatch(/1\.15\s*%/);
  });

  it('convierte una probabilidad decimal sin interpretarla como ocupación', () => {
    expect(component.formatearPorcentaje(0.0115018).replace(',', '.')).toContain('1.15');
    expect(fixture.nativeElement.textContent).not.toContain('ocupación predicha');
  });

  it('presenta el threshold devuelto como 36%', () => {
    ejecutar();
    const texto = fixture.nativeElement.querySelector('.probability-chart').textContent.replace(',', '.');
    expect(texto).toContain('36.00');
    expect(component.posicionThreshold).toBe(36);
  });

  it('renderiza BAJO con texto accesible y estilo propio', () => {
    ejecutar();
    const nivel = fixture.nativeElement.querySelector('.risk-level');
    expect(nivel.textContent).toContain('Riesgo bajo');
    expect(nivel.textContent).toContain('Probabilidad reducida');
    expect(nivel.classList).toContain('risk-bajo');
    expect(nivel.getAttribute('aria-label')).toBe('Riesgo bajo');
  });

  it('renderiza MEDIO como seguimiento preventivo sin alerta activa', () => {
    ejecutar({
      probabilidad_alta_presion: 0.28,
      nivel_riesgo: 'MEDIO',
      descripcion_riesgo: 'Probabilidad intermedia; requiere seguimiento preventivo.'
    });
    const nivel = fixture.nativeElement.querySelector('.risk-level');
    expect(nivel.textContent).toContain('Riesgo medio');
    expect(nivel.textContent).toContain('seguimiento preventivo');
    expect(nivel.classList).toContain('risk-medio');
    expect(fixture.nativeElement.querySelector('.alert-badge').textContent).toContain('Sin alerta');
  });

  it('renderiza ALTO junto con la alerta de alta presión', () => {
    ejecutar({
      probabilidad_alta_presion: 0.36,
      alerta_alta_presion: true,
      nivel_riesgo: 'ALTO',
      descripcion_riesgo: 'Probabilidad igual o superior al threshold operacional; requiere revisión prioritaria.'
    });
    const nivel = fixture.nativeElement.querySelector('.risk-level');
    expect(nivel.textContent).toContain('Riesgo alto');
    expect(nivel.textContent).toContain('revisión prioritaria');
    expect(nivel.classList).toContain('risk-alto');
    expect(fixture.nativeElement.querySelector('.alert-badge').textContent).toContain('Alerta de alta presión');
  });

  it('muestra las fronteras 20% y 36% recibidas del Backend', () => {
    ejecutar();
    const grafico = fixture.nativeElement.querySelector('.probability-chart');
    expect(grafico.textContent.replace(',', '.')).toContain('20.00% · Medio');
    expect(grafico.textContent.replace(',', '.')).toContain('36.00% · Alto');
    expect(component.posicionBajoMedio).toBe(20);
    expect(component.posicionThreshold).toBe(36);
  });

  it('ubica el indicador usando la probabilidad real sin redondearla para clasificar', () => {
    ejecutar({
      probabilidad_alta_presion: 0.35996,
      nivel_riesgo: 'MEDIO',
      descripcion_riesgo: 'Probabilidad intermedia; requiere seguimiento preventivo.'
    });
    expect(component.anchoProbabilidad).toBeCloseTo(35.996, 6);
    expect(fixture.nativeElement.querySelector('.risk-level').textContent).toContain('Riesgo medio');
  });

  it('rechaza defensivamente nivel y alerta incoherentes', () => {
    ejecutar({ probabilidad_alta_presion: 0.40, nivel_riesgo: 'ALTO', alerta_alta_presion: false });
    expect(component.resultado).toBeNull();
    expect(component.errorPrediccion).toContain('No fue posible obtener una predicción válida');
  });

  it('presenta alerta activa con texto además del color', () => {
    ejecutar({
      probabilidad_alta_presion: .8,
      alerta_alta_presion: true,
      nivel_riesgo: 'ALTO',
      descripcion_riesgo: 'Probabilidad igual o superior al threshold operacional; requiere revisión prioritaria.'
    });
    expect(fixture.nativeElement.querySelector('.alert-badge').textContent).toContain('Alerta de alta presión');
    expect(fixture.nativeElement.querySelector('.result-card').classList).toContain('result-alert');
  });

  it('presenta ausencia de alerta con texto explícito', () => {
    ejecutar();
    expect(fixture.nativeElement.querySelector('.alert-badge').textContent).toContain('Sin alerta de alta presión');
  });

  it('presenta el periodo predicho por Backend', () => {
    ejecutar();
    expect(fixture.nativeElement.querySelector('.result-grid').textContent).toContain('2025-07');
  });

  const errores: Array<[string, string]> = [
    ['HISTORIAL_INSUFICIENTE', 'No existen suficientes meses consecutivos'],
    ['MES_INTERMEDIO_FALTANTE', 'Falta información de uno o más meses'],
    ['CALIDAD_PENDIENTE', 'validaciones de calidad pendientes'],
    ['CALIDAD_INVALIDA', 'no cumplen los criterios de calidad'],
    ['IPRESS_NO_EXISTE', 'IPRESS seleccionada ya no se encuentra'],
    ['SERVICIO_NO_EXISTE', 'servicio seleccionado no tiene registros'],
    ['PERIODO_DUPLICADO', 'inconsistencia de datos para el periodo'],
    ['DATOS_INCOMPLETOS', 'historial están incompletos'],
    ['SERVICIO_FUERA_ALCANCE', 'fuera del alcance del modelo'],
    ['RESPUESTA_MODELO_INCONSISTENTE', 'No fue posible obtener una predicción válida']
  ];

  for (const [codigo, texto] of errores) {
    it(`muestra un mensaje amigable para ${codigo}`, () => {
      service.predecir.and.returnValue(throwError(() => new HttpErrorResponse({ error: { codigo } })));
      completarFormulario();
      component.predecir();
      fixture.detectChanges();
      expect(component.errorPrediccion).toContain(texto);
      expect(fixture.nativeElement.querySelector('.prediction-error').textContent).toContain('Sin predicción');
    });
  }

  it('incluye los periodos faltantes sin mostrar detalles técnicos', () => {
    service.predecir.and.returnValue(throwError(() => new HttpErrorResponse({
      error: { codigo: 'MES_INTERMEDIO_FALTANTE', periodos_faltantes: ['2025-04'] }
    })));
    completarFormulario();
    component.predecir();
    expect(component.errorPrediccion).toContain('2025-04');
    expect(component.errorPrediccion).not.toContain('HttpErrorResponse');
  });

  it('muestra estado loading y deshabilita el botón durante la petición', () => {
    const pendiente = new Subject<PrediccionBinariaAutomaticaResponse>();
    service.predecir.and.returnValue(pendiente);
    completarFormulario();
    component.predecir();
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('.predict-button') as HTMLButtonElement;
    expect(component.cargandoPrediccion).toBeTrue();
    expect(boton.disabled).toBeTrue();
    expect(boton.textContent).toContain('Generando predicción');
  });

  it('evita doble submit mientras existe una petición pendiente', () => {
    service.predecir.and.returnValue(new Subject<PrediccionBinariaAutomaticaResponse>());
    completarFormulario();
    component.predecir();
    component.predecir();
    expect(service.predecir).toHaveBeenCalledTimes(1);
  });

  it('rechaza defensivamente una respuesta con probabilidad inválida', () => {
    ejecutar({ probabilidad_alta_presion: 2 });
    expect(component.resultado).toBeNull();
    expect(component.errorPrediccion).toContain('No fue posible obtener una predicción válida');
  });

  it('explica correctamente que los niveles no son ocupación esperada', () => {
    const explicacion = fixture.nativeElement.querySelector('.explanation').textContent;
    expect(explicacion).toContain('supere el 90% durante el siguiente periodo');
    expect(explicacion).toContain('igual o mayor al 36%');
    expect(explicacion).toContain('no representan directamente el porcentaje esperado de ocupación');
    expect(explicacion).not.toContain('ocupación predicha');
  });
});
