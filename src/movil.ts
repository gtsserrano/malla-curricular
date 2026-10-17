// Versión para celular: la abre el código QR. Se toca una materia para ver su tarjeta.
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './movil.css';
import { CARRERAS, NOMBRE_CORTO, carreraActual, codigoCarrera } from './carreras';
import { abrirTarjeta, cerrarTarjeta, idAbierto, precargarGif } from './tarjeta3d';
import { ORDINALES, colorSemestre, idMateria, type Materia } from './types';

const codigo = codigoCarrera();
const malla = carreraActual();

document.title = `${malla.carrera} · Malla Curricular UPSA`;
document.getElementById('titulo')!.textContent = malla.carrera;
document.getElementById('subtitulo')!.textContent = [malla.plan, 'Malla curricular'].filter(Boolean).join(' · ');
document.getElementById('pie')!.textContent =
  `Contenido basado en los contenidos mínimos del ${malla.plan ?? 'plan de estudios'} · UPSA`;

// Selector para pasar a la otra carrera
document.getElementById('selector')!.innerHTML = Object.keys(CARRERAS)
  .map((c) => `<a href="?c=${c}" class="${c === codigo ? 'activa' : ''}">${NOMBRE_CORTO[c] ?? c}</a>`)
  .join('');

function cuadro(m: Materia) {
  return `<button type="button" class="materia" data-id="${idMateria(m)}" style="--color:${colorSemestre(m.semestre)}">
    ${m.sigla ? `<small>${m.sigla}</small>` : ''}<span>${m.nombre}</span>
  </button>`;
}

function seccion(titulo: string, materias: Materia[]) {
  return `<section class="semestre"><h2>${titulo}</h2><div class="cuadros">${materias.map(cuadro).join('')}</div></section>`;
}

const semestres = Math.max(...malla.materias.map((m) => m.semestre));
let html = '';
for (let s = 1; s <= semestres; s++) {
  html += seccion(`${ORDINALES[s - 1] ?? s + '°'} semestre`, malla.materias.filter((m) => m.semestre === s));
}
const electivas = malla.materias.filter((m) => m.semestre === 0);
if (electivas.length) html += seccion('Electivas', electivas);
document.getElementById('lista')!.innerHTML = html;

// ---------- Abrir y cerrar la tarjeta ----------
const capa = document.getElementById('capa-tarjeta')!;

function cerrar() {
  if (!idAbierto()) return;
  cerrarTarjeta();
  document.body.classList.remove('con-tarjeta');
}

document.getElementById('lista')!.addEventListener('click', (e) => {
  const celda = (e.target as HTMLElement).closest<HTMLElement>('.materia');
  if (!celda) return;
  precargarGif(celda, malla);
  abrirTarjeta(celda, malla);
  document.querySelector<HTMLElement>('#tarjeta .reverso')!.scrollTop = 0;
  document.body.classList.add('con-tarjeta');
  // Así el botón "atrás" del celular cierra la tarjeta en vez de salir de la página
  history.pushState({ tarjeta: true }, '');
});

const cerrarConHistorial = () => (history.state?.tarjeta ? history.back() : cerrar());
document.getElementById('cerrar')!.addEventListener('click', cerrarConHistorial);
capa.addEventListener('click', (e) => e.target === capa && cerrarConHistorial());
addEventListener('popstate', cerrar);
addEventListener('keydown', (e) => e.key === 'Escape' && cerrarConHistorial());
