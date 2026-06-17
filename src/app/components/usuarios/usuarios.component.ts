import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario, UsuarioRegistro } from '../../models/usuario';
import { Rol } from '../../models/rol';
import { Ipress } from '../../models/ipress';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  roles: Rol[] = [];
  ipress: Ipress[] = [];

  cargando: boolean = false;
  guardando: boolean = false;
  error: string = '';
  mensaje: string = '';

  filtroTexto: string = '';
  filtroRol: string = 'TODOS';
  filtroIpress: string = 'TODAS';
  filtroEstado: string = 'TODOS';

  mostrarFormulario: boolean = true;
  modoEdicion: boolean = false;
  nuevoUsuario: UsuarioRegistro = {
    idUsuario: null,
    nombre: '',
    correo: '',
    contrasena: '',
    estado: true,
    idRol: null,
    idIpress: null
  };

  constructor(private usuarioService: UsuarioService,
  private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }
  esUsuarioActual(usuario: Usuario): boolean {
    const usuarioActual = this.authService.obtenerUsuarioActual();
    return usuarioActual?.idUsuario === usuario.idUsuario;
  }
  cargarDatos(): void {
  this.cargando = true;
  this.error = '';

  this.usuarioService.listarUsuarios().subscribe({
    next: (usuarios) => {
      this.usuarios = usuarios;
      this.usuariosFiltrados = usuarios;
      this.cargando = false;
    },
    error: (error) => {
      console.error('Error al cargar usuarios:', error);
      this.error = 'No se pudieron cargar los usuarios. Verifica que el backend esté activo.';
      this.cargando = false;
    }
  });

  this.usuarioService.listarRoles().subscribe({
    next: (roles) => {
      this.roles = roles;
    },
    error: (error) => {
      console.error('Error al cargar roles:', error);
    }
  });

  this.usuarioService.listarIpress().subscribe({
    next: (ipress) => {
      this.ipress = ipress;
    },
    error: (error) => {
      console.error('Error al cargar IPRESS:', error);
    }
  });
  }

  aplicarFiltros(): void {
    const texto = this.filtroTexto.toLowerCase().trim();

    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const coincideTexto =
        usuario.nombre?.toLowerCase().includes(texto) ||
        usuario.correo?.toLowerCase().includes(texto) ||
        usuario.nombreRol?.toLowerCase().includes(texto) ||
        usuario.nombreIpress?.toLowerCase().includes(texto);

      const coincideRol =
        this.filtroRol === 'TODOS' ||
        usuario.nombreRol === this.filtroRol;

      const coincideIpress =
        this.filtroIpress === 'TODAS' ||
        usuario.nombreIpress === this.filtroIpress;

      const estadoTexto = usuario.estado ? 'ACTIVO' : 'INACTIVO';

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        estadoTexto === this.filtroEstado;

      return coincideTexto && coincideRol && coincideIpress && coincideEstado;
    });
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroRol = 'TODOS';
    this.filtroIpress = 'TODAS';
    this.filtroEstado = 'TODOS';
    this.usuariosFiltrados = this.usuarios;
  }

  guardarUsuario(): void {
  this.error = '';
  this.mensaje = '';

  if (!this.nuevoUsuario.nombre.trim()) {
    this.error = 'Ingrese el nombre completo del usuario.';
    return;
  }

  if (!this.nuevoUsuario.correo.trim()) {
    this.error = 'Ingrese el correo institucional del usuario.';
    return;
  }

  if (!this.modoEdicion && !this.nuevoUsuario.contrasena.trim()) {
    this.error = 'Ingrese una contraseña temporal para el nuevo usuario.';
    return;
  }

  if (!this.nuevoUsuario.idRol) {
    this.error = 'Seleccione un rol para el usuario.';
    return;
  }

  this.guardando = true;

  if (this.modoEdicion) {
    this.usuarioService.modificarUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.mensaje = 'Usuario actualizado correctamente.';
        this.guardando = false;
        this.limpiarFormulario();
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        this.error = 'No se pudo actualizar el usuario. Verifica los datos ingresados.';
        this.guardando = false;
      }
    });

    return;
  }

  this.usuarioService.registrarUsuario(this.nuevoUsuario).subscribe({
    next: () => {
      this.mensaje = 'Usuario registrado correctamente.';
      this.guardando = false;
      this.limpiarFormulario();
      this.cargarDatos();
    },
    error: (error) => {
      console.error('Error al registrar usuario:', error);
      this.error = 'No se pudo registrar el usuario. Verifica los datos ingresados.';
      this.guardando = false;
    }
  });
}
  editarUsuario(usuario: Usuario): void {
  this.error = '';
  this.mensaje = '';
  this.modoEdicion = true;
  this.mostrarFormulario = true;

  this.usuarioService.obtenerUsuarioPorId(usuario.idUsuario).subscribe({
    next: (data) => {
      this.nuevoUsuario = {
        idUsuario: data.idUsuario,
        nombre: data.nombre,
        correo: data.correo,
        contrasena: '',
        estado: data.estado,
        idRol: data.idRol,
        idIpress: data.idIpress
      };
    },
    error: (error) => {
      console.error('Error al obtener usuario:', error);
      this.error = 'No se pudo cargar la información del usuario seleccionado.';
    }
  });
}


  limpiarFormulario(): void {
  this.modoEdicion = false;

  this.nuevoUsuario = {
    idUsuario: null,
    nombre: '',
    correo: '',
    contrasena: '',
    estado: true,
    idRol: null,
    idIpress: null
  };
}

  obtenerIniciales(nombre: string): string {
    if (!nombre) {
      return 'U';
    }

    const partes = nombre.trim().split(' ');

    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
  }

  obtenerClaseEstado(estado: boolean): string {
    return estado ? 'estado-activo' : 'estado-inactivo';
  }

  contarActivos(): number {
    return this.usuarios.filter(usuario => usuario.estado).length;
  }

  contarInactivos(): number {
    return this.usuarios.filter(usuario => !usuario.estado).length;
  }
  obtenerNombreRolVisible(nombreRol: string | null | undefined): string {
  switch (nombreRol) {
    case 'ADMINISTRADOR':
      return 'Administrador de la plataforma';
    case 'ADMISION_REGISTROS':
      return 'Oficina de Admisión y Registros Médicos';
    case 'ATENCION_HOSPITALIZACION':
      return 'Oficina de Atención de Hospitalización';
    case 'Responsable de información hospitalaria':
      return 'Oficina de Admisión y Registros Médicos';
    case 'Responsable de gestión hospitalaria':
      return 'Oficina de Atención de Hospitalización';
    default:
      return nombreRol || 'Sin rol';
  }
}
  cambiarEstadoUsuario(usuario: Usuario): void {
  this.error = '';
  this.mensaje = '';

  if (usuario.estado) {
    this.usuarioService.inactivarUsuario(usuario.idUsuario).subscribe({
      next: () => {
        this.mensaje = 'Usuario inactivado correctamente.';
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al inactivar usuario:', error);
        this.error = 'No se pudo inactivar el usuario.';
      }
    });
  } else {
    this.usuarioService.activarUsuario(usuario.idUsuario).subscribe({
      next: () => {
        this.mensaje = 'Usuario activado correctamente.';
        this.cargarDatos();
      },
      error: (error) => {
        console.error('Error al activar usuario:', error);
        this.error = 'No se pudo activar el usuario.';
      }
    });
  }
}
}
