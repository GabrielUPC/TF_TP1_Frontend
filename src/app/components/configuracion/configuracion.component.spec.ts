import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConfiguracionComponent } from './configuracion.component';
import { SesionUsuario } from '../../models/sesion-usuario';
import { AuthService } from '../../services/auth.service';

describe('ConfiguracionComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'obtenerUsuarioActual'
    ]);

    await TestBed.configureTestingModule({
      imports: [ConfiguracionComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();
  });

  it('debe mostrar los permisos administrativos del OE2', () => {
    authService.obtenerUsuarioActual.and.returnValue(
      crearSesion('ADMINISTRADOR', null)
    );

    const component = TestBed.createComponent(ConfiguracionComponent).componentInstance;
    const configuracion = component.obtenerConfiguracionRol();

    expect(configuracion?.rutaPrincipal).toBe('/usuarios');
    expect(configuracion?.permisos).toContain('Asignar roles e IPRESS');
    expect(component.obtenerIpress()).toBe('Acceso administrativo general');
  });

  it('debe limitar admision a la IPRESS asignada', () => {
    authService.obtenerUsuarioActual.and.returnValue(
      crearSesion('ADMISION_REGISTROS', 12)
    );

    const component = TestBed.createComponent(ConfiguracionComponent).componentInstance;
    const configuracion = component.obtenerConfiguracionRol();

    expect(configuracion?.rutaPrincipal).toBe('/carga-excel');
    expect(configuracion?.permisos).toContain('Cargar y validar archivos Excel');
    expect(component.obtenerIpress()).toBe('Hospital de prueba');
  });
});

function crearSesion(rol: string, idIpress: number | null): SesionUsuario {
  return {
    jwttoken: 'token',
    idUsuario: 1,
    nombre: 'Usuario de prueba',
    correo: 'usuario@ipress.gob.pe',
    rol,
    nombreRol: rol,
    idIpress,
    nombreIpress: idIpress ? 'Hospital de prueba' : '',
    ipressAsignada: idIpress ? 'Hospital de prueba' : ''
  };
}
