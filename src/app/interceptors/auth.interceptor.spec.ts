import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['obtenerToken']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('agrega el Bearer token al request del flujo binario', () => {
    auth.obtenerToken.and.returnValue('token-prueba');
    httpClient.post('/predicciones-riesgo/binaria/automatica', {}).subscribe();
    const request = httpTesting.expectOne('/predicciones-riesgo/binaria/automatica');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-prueba');
    request.flush({});
  });

  it('no inventa encabezado Authorization cuando no hay token', () => {
    auth.obtenerToken.and.returnValue(null);
    httpClient.get('/dashboard/detalle').subscribe();
    const request = httpTesting.expectOne('/dashboard/detalle');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });
});
