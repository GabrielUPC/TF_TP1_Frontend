import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ArchivosComponent } from './archivos.component';
import { ArchivoService } from '../../services/archivo.service';
import { ArchivoCargado } from '../../models/archivo-cargado';

describe('ArchivosComponent', () => {
  const historico: ArchivoCargado = {
    idArchivo: 38,
    nombreArchivo: 'd1_datos_validos.csv',
    formato: 'DATASET_D1',
    fechaCarga: '2026-11-01T19:37:07.998074',
    fechaCargaUtc: null,
    estadoValidacion: 'VALIDADO',
    estadoProcesamiento: 'PROCESADO',
    nombreUsuario: 'QA Admisión A',
    nombreIpress: 'IPRESS QA SINTETICA'
  };

  const nuevo: ArchivoCargado = {
    ...historico,
    idArchivo: 39,
    nombreArchivo: 'nueva_carga.csv',
    fechaCargaUtc: '2026-11-01T19:37:07Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivosComponent],
      providers: [{ provide: ArchivoService, useValue: { listarArchivos: () => of([historico, nuevo]) } }]
    }).compileComponents();
  });

  it('convierte solo instantes acreditados a America/Lima y preserva el valor historico', () => {
    const fixture = TestBed.createComponent(ArchivosComponent);
    fixture.detectChanges();
    const componente = fixture.componentInstance;

    expect(componente.mostrarFechaCarga(nuevo)).toBe('01/11/2026 14:37');
    expect(componente.mostrarFechaCarga(historico)).toBe('01/11/2026 19:37');
    const sinCampoUtc = { ...historico };
    delete sinCampoUtc.fechaCargaUtc;
    expect(componente.mostrarFechaCarga(sinCampoUtc)).toBe('01/11/2026 19:37');
    expect(fixture.nativeElement.textContent).toContain('Hora de Perú');
    expect(fixture.nativeElement.textContent).toContain('Zona histórica no verificada');
  });

  it('mantiene los filtros de historial y Limpiar restaura la lista', () => {
    const fixture = TestBed.createComponent(ArchivosComponent);
    fixture.detectChanges();
    const componente = fixture.componentInstance;

    componente.aplicarFiltroTexto({ target: { value: 'nueva_carga' } } as unknown as Event);
    expect(componente.archivosFiltrados.map(archivo => archivo.idArchivo)).toEqual([39]);
    componente.aplicarFiltroEstado({ target: { value: 'ERROR' } } as unknown as Event);
    expect(componente.archivosFiltrados).toEqual([]);
    componente.limpiarFiltros();
    expect(componente.archivosFiltrados.map(archivo => archivo.idArchivo)).toEqual([38, 39]);
  });
});
