import { of } from 'rxjs';

import { UsuariosComponent } from './usuarios.component';

describe('UsuariosComponent', () => {
  function crearComponente() {
    const usuarioService = jasmine.createSpyObj('UsuarioService', [
      'registrarUsuario', 'modificarUsuario', 'listarUsuarios',
      'listarRoles', 'listarIpress'
    ]);
    const authService = jasmine.createSpyObj('AuthService', ['obtenerUsuarioActual']);
    usuarioService.registrarUsuario.and.returnValue(of(void 0));
    usuarioService.modificarUsuario.and.returnValue(of(void 0));
    usuarioService.listarUsuarios.and.returnValue(of([]));
    usuarioService.listarRoles.and.returnValue(of([]));
    usuarioService.listarIpress.and.returnValue(of([]));
    const componente = new UsuariosComponent(usuarioService, authService);
    componente.roles = [
      { idRol: 1, nombreRol: 'ADMINISTRADOR', descripcion: '' },
      { idRol: 2, nombreRol: 'ADMISION_REGISTROS', descripcion: '' },
      { idRol: 3, nombreRol: 'ATENCION_HOSPITALIZACION', descripcion: '' }
    ];
    componente.nuevoUsuario = {
      idUsuario: null, nombre: 'Usuario QA', correo: 'qa@ipress.pe',
      contrasena: 'Temporal-2026', estado: true, idRol: 2, idIpress: null
    };
    return { componente, usuarioService };
  }

  it('impide registrar un rol operativo sin IPRESS', () => {
    const { componente, usuarioService } = crearComponente();

    componente.guardarUsuario();

    expect(componente.error).toContain('Seleccione una IPRESS');
    expect(usuarioService.registrarUsuario).not.toHaveBeenCalled();
  });

  it('permite registrar un rol operativo con IPRESS', () => {
    const { componente, usuarioService } = crearComponente();
    componente.nuevoUsuario.idIpress = 1;

    componente.guardarUsuario();

    expect(usuarioService.registrarUsuario).toHaveBeenCalled();
  });

  it('no exige IPRESS al administrador', () => {
    const { componente, usuarioService } = crearComponente();
    componente.nuevoUsuario.idRol = 1;

    componente.guardarUsuario();

    expect(usuarioService.registrarUsuario).toHaveBeenCalled();
  });
});
