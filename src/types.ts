export interface Materia {
  nombre: string;
  semestre: number;
  descripcion: string;
  /** "¿Qué aprenderás?" */
  temas: string[];
  /** "¿Para qué te sirve?" */
  utilidad: string;
  herramientas?: string[];
  /** Emoji que se muestra mientras no exista la foto */
  icono?: string;
  /** Opcional: si no se indica, se usa img/<id>.jpg */
  imagen?: string;
}

export interface Malla {
  carrera: string;
  universidad: string;
  materias: Materia[];
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
