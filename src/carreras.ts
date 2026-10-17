import m550 from './data/malla-550.json';
import m590 from './data/malla-590.json';
import type { Malla } from './types';

/** Carreras disponibles. La clave es el código del plan y se elige con ?c=<código> en la dirección. */
export const CARRERAS: Record<string, Malla> = {
  '550': m550 as Malla,
  '590': m590 as Malla,
};

/** Nombre corto para el selector de la versión del celular */
export const NOMBRE_CORTO: Record<string, string> = {
  '550': 'Sistemas e IA',
  '590': 'Informática y Gestión',
};

export const CARRERA_POR_DEFECTO = '590';

export function codigoCarrera() {
  const c = new URLSearchParams(location.search).get('c') ?? '';
  return c in CARRERAS ? c : CARRERA_POR_DEFECTO;
}

export function carreraActual() {
  return CARRERAS[codigoCarrera()];
}
