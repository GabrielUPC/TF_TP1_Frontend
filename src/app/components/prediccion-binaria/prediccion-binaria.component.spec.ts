import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrediccionBinariaComponent } from './prediccion-binaria.component';
import { PrediccionBinariaService } from '../../services/prediccion-binaria.service';
import { AuthService } from '../../services/auth.service';

describe('PrediccionBinariaComponent auxiliar', () => {
  let fixture: ComponentFixture<PrediccionBinariaComponent>;
  let service: jasmine.SpyObj<PrediccionBinariaService>;
  beforeEach(async () => {
    service = jasmine.createSpyObj('PrediccionBinariaService', ['obtenerCatalogo', 'predecir']);
    service.obtenerCatalogo.and.returnValue(of({
      codigoIpress: '00006210', nombreIpress: 'Hospital',
      servicios: [{ servicio: 'MEDICINA', periodosDisponibles: ['2025-06'] }]
    }));
    service.predecir.and.returnValue(of({
      probabilidad_alta_presion: .41, threshold: .36, alerta_alta_presion: true,
      nivel_riesgo: 'ALTO', descripcion_riesgo: 'Alta presión', umbral_bajo_medio: .20,
      codigo_ipress: '00006210', servicio_hospitalizacion: 'MEDICINA',
      periodo_actual: '2025-06', periodo_predicho: '2025-07',
      modelo: 'modelo_ipress_binario_v1'
    }));
    await TestBed.configureTestingModule({
      imports: [PrediccionBinariaComponent],
      providers: [
        { provide: PrediccionBinariaService, useValue: service },
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['obtenerUsuarioActual']) }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(PrediccionBinariaComponent);
    fixture.detectChanges();
  });
  it('consume el catálogo autorizado y no envía co_ipress', () => {
    const c = fixture.componentInstance;
    c.servicio = 'MEDICINA'; c.periodoActual = '2025-06'; c.predecir();
    expect(service.predecir).toHaveBeenCalledOnceWith({
      servicio: 'MEDICINA', periodo_actual: '2025-06'
    });
  });
});
