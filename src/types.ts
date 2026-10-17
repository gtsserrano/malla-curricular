export interface Materia {
  nombre: string;
  semestre: number;
  /** Datos oficiales del plan de estudio */
  sigla: string;
  creditos: number;
  horasTeoricas: number;
  horasPracticas: number;
  /** Siglas de los prerrequisitos separadas por "-" (vacío si no tiene) */
  requisitos: string;
  descripcion: string;
  /** "¿Qué aprenderás?" */
  temas: string[];
  /** "¿Para qué te sirve?" */
  utilidad: string;
  herramientas?: string[];
  /** Emoji cuya versión animada (GIF de Noto Animated Emoji) se muestra mientras no exista la foto */
  icono?: string;
  /** Opcional: si no se indica, se usa img/<id>.jpg */
  imagen?: string;
}

export interface Malla {
  carrera: string;
  universidad: string;
  plan?: string;
  materias: Materia[];
}

/** "⚖️" -> "2696_fe0f": código con el que Google publica cada emoji animado */
export function codigoEmoji(emoji: string) {
  return [...emoji].map((c) => c.codePointAt(0)!.toString(16)).join('_');
}

/**
 * Posibles URLs del GIF animado de un emoji, en orden de preferencia:
 * primero la copia local (`npm run offline`), luego el CDN de Google.
 */
export function urlsGif(emoji: string) {
  const codigo = codigoEmoji(emoji);
  return [`gif/${codigo}.gif`, `https://fonts.gstatic.com/s/e/notoemoji/latest/${codigo}/512.gif`];
}

export const ORDINALES = [
  'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto',
  'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo',
];

/** "Cálculo I" -> "calculo-i" (sirve como id y nombre de la foto) */
export function idMateria(m: Materia) {
  return m.nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function imagenMateria(m: Materia) {
  return m.imagen ?? `img/${idMateria(m)}.jpg`;
}

/** Semestres impares en verde oscuro, pares en verde claro (como la malla oficial) */
export function colorSemestre(semestre: number) {
  return semestre % 2 === 1 ? 'var(--verde-oscuro)' : 'var(--verde-claro)';
}
