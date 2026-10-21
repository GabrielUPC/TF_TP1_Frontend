import { routes } from './app.routes';

describe('rutas predictivas', () => {
  it('mantiene el dashboard y redirige la ruta binaria anterior hacia él', () => {
    expect(routes.some((route) => route.path === 'dashboard')).toBeTrue();
    const rutaAnterior = routes.find((route) => route.path === 'prediccion-binaria');
    expect(rutaAnterior?.redirectTo).toBe('dashboard');
    expect(rutaAnterior?.pathMatch).toBe('full');
    expect(rutaAnterior?.component).toBeUndefined();
  });
});
