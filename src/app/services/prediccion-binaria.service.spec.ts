import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environment';
import { PrediccionBinariaService } from './prediccion-binaria.service';

describe('PrediccionBinariaService', () => {
  let service: PrediccionBinariaService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PrediccionBinariaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('obtiene el catálogo binario sin usar dashboard/detalle', () => {
    const catalogo = { codigoIpress: '00006210', nombreIpress: 'Hospital',
      servicios: [{ servicio: 'MEDICINA', periodosDisponibles: ['2025-06'] }] };
    service.obtenerCatalogo().subscribe(r => expect(r).toEqual(catalogo));
    const request = http.expectOne(`${environment.base}/predicciones-riesgo/binaria/catalogo`);
    expect(request.request.url).not.toContain('/dashboard/detalle');
    request.flush(catalogo);
  });

  it('envía solo servicio y periodo; la IPRESS no procede del navegador', () => {
    service.predecir({ servicio: 'MEDICINA', periodo_actual: '2025-06' }).subscribe();
    const request = http.expectOne(`${environment.base}/predicciones-riesgo/binaria/automatica`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ servicio: 'MEDICINA', periodo_actual: '2025-06' });
    expect(request.request.body.co_ipress).toBeUndefined();
    request.flush({});
  });
});
