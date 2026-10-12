import { colorSemestre, idMateria, ORDINALES, type Malla } from './types';

/** ¿El nombre cabe completo dentro de su cuadro (alto y ancho, sin cortar palabras)? */
function cabe(celda: HTMLElement) {
  const texto = celda.firstElementChild as HTMLElement;
  const estilo = getComputedStyle(celda);
  const altoUtil = celda.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
  const anchoUtil = celda.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
  // +1 px: las medidas del texto vienen redondeadas a enteros y las del cuadro tienen decimales
  return texto.offsetHeight <= altoUtil + 1 && texto.scrollWidth <= anchoUtil + 1;
}

/**
 * Busca el tamaño de letra más grande con el que TODOS los nombres caben en sus cuadros
 * y lo aplica a toda la malla (mismo tamaño en todos los cuadros = se ve ordenado).
 * Se recalcula al cambiar el tamaño de la ventana o al entrar en pantalla completa.
 */
export function ajustarTextos() {
  const tablero = document.getElementById('tablero')!;
  const celdas = [...tablero.querySelectorAll<HTMLElement>('.materia')];
  if (!celdas.length) return;

  const maximo = Math.min(innerWidth * 0.0125, innerHeight * 0.024, 26); // tope: ~1.25vw / 2.4vh
  let min = 6;
  let max = maximo;
  for (let i = 0; i < 12; i++) {
    const medio = (min + max) / 2;
    tablero.style.setProperty('--tam-materia', `${medio}px`);
    if (celdas.every(cabe)) min = medio;
    else max = medio;
  }
  tablero.style.setProperty('--tam-materia', `${Math.floor(min * 10) / 10}px`);
}

/** Dibuja la malla: una fila por semestre, cada materia en un cuadro independiente. */
export function renderMalla(malla: Malla) {
  document.getElementById('encabezado')!.innerHTML =
    `<h1>${malla.carrera}</h1><span>${malla.universidad}</span>`;

  const semestres = Math.max(...malla.materias.map((m) => m.semestre));
  const columnas = Math.max(
    ...Array.from({ length: semestres }, (_, i) => malla.materias.filter((m) => m.semestre === i + 1).length),
  );

  const etiquetas = document.getElementById('etiquetas')!;
  const tablero = document.getElementById('tablero')!;
  const contenedor = document.getElementById('malla')!;
  contenedor.style.setProperty('--filas', String(semestres));
  tablero.style.gridTemplateColumns = `repeat(${columnas}, 1fr)`;

  for (let s = 1; s <= semestres; s++) {
    const etiqueta = document.createElement('div');
    etiqueta.className = 'etiqueta';
    etiqueta.innerHTML = `${ORDINALES[s - 1] ?? s + '°'}<br>Semestre`;
    etiquetas.appendChild(etiqueta);

    const delSemestre = malla.materias.filter((m) => m.semestre === s);
    for (let c = 0; c < columnas; c++) {
      const m = delSemestre[c];
      const celda = document.createElement('div');
      celda.style.setProperty('--color', colorSemestre(s));
      if (m) {
        celda.className = 'materia';
        celda.dataset.id = idMateria(m);
        const texto = document.createElement('span');
        texto.textContent = m.nombre;
        celda.appendChild(texto);
      } else {
        celda.className = 'vacia ' + (s % 2 === 1 ? 'impar' : 'par');
      }
      tablero.appendChild(celda);
    }
  }
}
