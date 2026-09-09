import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environment';
import { PrediccionBinariaService } from './prediccion-binaria.service';

describe('PrediccionBinariaService', () => {
  let service: PrediccionBinariaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PrediccionBinariaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga el catálogo desde el detalle autenticado del dashboard', () => {
    service.obtenerCatalogo().subscribe((datos) => expect(datos).toEqual([]));
    const request = http.expectOne(`${environment.base}/dashboard/detalle`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('envía el request binario con nombres exactos y sin features calculadas', () => {
    const solicitud = {
      co_ipress: '00006210',
      servicio: 'HOSPITALIZACIÓN DE MEDICINA ONCOLOGÍA MÉDICA',
      periodo_actual: '2025-06'
    };
    service.predecir(solicitud).subscribe();
    const request = http.expectOne(`${environment.base}/predicciones-riesgo/binaria/automatica`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(solicitud);
    expect(Object.keys(request.request.body)).toEqual(['co_ipress', 'servicio', 'periodo_actual']);
    request.flush({});
  });
});
