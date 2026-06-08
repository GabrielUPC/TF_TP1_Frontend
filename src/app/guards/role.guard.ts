import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.obtenerUsuarioActual();

  if (!usuario || !authService.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  const rolesPermitidos = route.data?.['roles'] as string[];

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  if (rolesPermitidos.includes(usuario.rol)) {
    return true;
  }

  const rutaInicial = authService.obtenerRutaInicial(usuario.rol);

  return router.createUrlTree([rutaInicial ?? '/login']);
};
