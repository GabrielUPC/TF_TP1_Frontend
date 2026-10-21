import { DashboardComponent } from './dashboard.component';
import { DashboardDetalle } from '../../models/dashboard-detalle';

describe('DashboardComponent - indicadores no calculables', () => {
  let component: DashboardComponent;

  beforeEach(() => {
    component = new DashboardComponent({} as never, {} as never, {} as never, {} as never);
  });

  for (const valor of [null, undefined, Number.NaN]) {
    it(`muestra N/D para ocupación no disponible: ${String(valor)}`, () => {
      expect(component.formatearPorcentaje(valor)).toBe('N/D');
    });

    it(`muestra N/D para presión no disponible: ${String(valor)}`, () => {
      expect(component.formatearNumero(valor, 2)).toBe('N/D');
    });

    it(`muestra N/D para promedio de estancia no disponible: ${String(valor)}`, () => {
      expect(component.formatearDias(valor)).toBe('N/D');
    });
  }

  it('conserva cero como valor válido en los tres indicadores', () => {
    expect(component.formatearPorcentaje(0)).toBe('0.0%');
    expect(component.formatearNumero(0, 2)).toBe('0');
    expect(component.formatearDias(0)).toBe('0 días');
  });

  for (const valor of [null, undefined, Number.NaN]) {
    it(`marca como NO EVALUABLE las acciones con indicadores ${String(valor)}`, () => {
      component.detalle = [detalle({
        ocupacionEstimada: valor,
        presionIngresosCamas: valor,
        promedioEstancia: valor
      })];

      const acciones = component.accionesSugeridas;

      expect(acciones.find(a => a.indicador === 'Porcentaje de ocupación'))
        .toEqual(jasmine.objectContaining({ valor: 'N/D', prioridad: 'NO EVALUABLE' }));
      expect(acciones.find(a => a.indicador === 'Presión ingresos/camas'))
        .toEqual(jasmine.objectContaining({ valor: 'N/D', prioridad: 'NO EVALUABLE' }));
      expect(acciones.find(a => a.indicador === 'Promedio de estancia'))
        .toEqual(jasmine.objectContaining({ valor: 'N/D', prioridad: 'NO EVALUABLE' }));
    });
  }

  it('evalúa como datos válidos los ceros de los tres indicadores', () => {
    component.detalle = [detalle({
      ocupacionEstimada: 0,
      presionIngresosCamas: 0,
      promedioEstancia: 0
    })];

    const acciones = component.accionesSugeridas;

    expect(acciones.find(a => a.indicador === 'Porcentaje de ocupación'))
      .toEqual(jasmine.objectContaining({ valor: '0.0%', prioridad: 'BAJA' }));
    expect(acciones.find(a => a.indicador === 'Presión ingresos/camas'))
      .toEqual(jasmine.objectContaining({ valor: '0', prioridad: 'BAJA' }));
    expect(acciones.find(a => a.indicador === 'Promedio de estancia'))
      .toEqual(jasmine.objectContaining({ valor: '0 días', prioridad: 'BAJA' }));
  });
});

function detalle(cambios: Partial<DashboardDetalle>): DashboardDetalle {
  return {
    idIndicador: 1, idRegistro: 1, idArchivo: 1, nombreArchivo: 'D1.csv',
    anio: 2025, mes: 1, servicioHospitalario: 'HOSPITALIZACIÓN', codigoIpress: '00000001',
    ingresos: 0, egresos: 0, estancias: 0, pacientesCama: 0,
    camasTotales: 10, totalCamasDisponibles: 300,
    ocupacionEstimada: 0, presionIngresosCamas: 0,
    promedioEstancia: 0, rotacionCamas: 0,
    ...cambios
  };
}
