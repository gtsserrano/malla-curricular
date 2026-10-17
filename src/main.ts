import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './styles.css';
import { carreraActual } from './carreras';
import { ajustarTextos, renderMalla } from './malla';
import { abrirTarjeta, cerrarTarjeta, idAbierto, precargarGif } from './tarjeta3d';
import { iniciarRastreo } from './rastreoMano';

// Carrera según ?c=550 / ?c=590 (por defecto 550). En el stand se muestran solo los semestres, sin las electivas libres.
const malla = carreraActual();
document.title = `Malla Curricular · ${malla.carrera} · UPSA`;
renderMalla(malla);
ajustarTextos();
// Recalcular cuando cargue la fuente Poppins y cuando cambie el tamaño de la pantalla
document.fonts.ready.then(ajustarTextos);
let ajustePendiente = 0;
addEventListener('resize', () => {
  clearTimeout(ajustePendiente);
  ajustePendiente = window.setTimeout(ajustarTextos, 100);
});

const puntero = document.getElementById('puntero')!;
const video = document.getElementById('camara') as HTMLVideoElement;
const vistaCamara = document.getElementById('vista-camara')!;
const estado = document.getElementById('estado')!;

// Tiempo que hay que mantener el puntero sobre una materia para abrirla (evita aperturas accidentales)
const TIEMPO_ESPERA_MS = 2000;
// Una vez elegido un cuadro, el puntero puede salirse hasta estos píxeles del borde sin perder la carga
// (absorbe el temblor de la mano y las líneas blancas entre cuadros)
const TOLERANCIA_PX = 30;
// Salidas breves del cuadro o pérdidas momentáneas de la mano no reinician la carga
const GRACIA_MS = 400;

const celdas = [...document.querySelectorAll<HTMLElement>('.materia')];

let px = 0;
let py = 0;
let hayPuntero = false;
let perdidoDesde = 0;
/** Mano cerrada en puño: cierra la tarjeta y no selecciona materias hasta que se vuelva a abrir */
let puno = false;

let candidata: HTMLElement | null = null;
let desdeCandidata = 0;
let fueraCandidataDesde = 0;

function dentro(el: HTMLElement, x: number, y: number, margen = 0) {
  const r = el.getBoundingClientRect();
  return x >= r.left - margen && x <= r.right + margen && y >= r.top - margen && y <= r.bottom + margen;
}

function elegir(celda: HTMLElement | null, ahora: number) {
  candidata?.classList.remove('cargando');
  candidata = celda;
  desdeCandidata = ahora;
  fueraCandidataDesde = 0;
  celda?.classList.add('cargando');
  if (celda) precargarGif(celda, malla);
}

/** La mano y el mouse solo actualizan la posición; la decisión se toma en cada frame (bucle). */
function moverPuntero(x: number, y: number, esPuno = false) {
  px = x;
  py = y;
  hayPuntero = true;
  puno = esPuno;
  puntero.style.transform = `translate(${x}px, ${y}px)`;
  puntero.classList.add('activo');
  puntero.classList.toggle('puno', esPuno);
}

function manoPerdida() {
  if (hayPuntero) perdidoDesde = performance.now();
  hayPuntero = false;
  puno = false;
  puntero.classList.remove('activo');
}

function bucle() {
  const ahora = performance.now();

  if (hayPuntero && puno) {
    // ✊ Puño cerrado: cierra la tarjeta abierta y cancela cualquier carga en curso
    if (idAbierto()) cerrarTarjeta();
    if (candidata) elegir(null, ahora);
  } else if (idAbierto()) {
    // La tarjeta abierta SOLO se cierra con el puño: salir de sus bordes o perder la mano no la cierra
  } else if (!hayPuntero) {
    if (candidata && ahora - perdidoDesde > GRACIA_MS) elegir(null, ahora);
  } else if (candidata && dentro(candidata, px, py, TOLERANCIA_PX)) {
    // Sigue sobre el mismo cuadro (en cualquier parte, o apenas fuera del borde)
    fueraCandidataDesde = 0;
  } else {
    const nueva = celdas.find((c) => dentro(c, px, py)) ?? null;
    if (nueva) {
      elegir(nueva, ahora);
    } else if (candidata) {
      if (!fueraCandidataDesde) fueraCandidataDesde = ahora;
      else if (ahora - fueraCandidataDesde > GRACIA_MS) elegir(null, ahora);
    }
  }

  if (candidata && !idAbierto() && ahora - desdeCandidata >= TIEMPO_ESPERA_MS) {
    const celda = candidata;
    elegir(null, ahora);
    abrirTarjeta(celda, malla);
  }

  const progreso = candidata ? Math.min(1, (ahora - desdeCandidata) / TIEMPO_ESPERA_MS) : 0;
  puntero.style.setProperty('--progreso', String(progreso));
  candidata?.style.setProperty('--progreso', String(progreso));
}
setInterval(bucle, 30);

// El mouse también funciona (útil para desarrollar sin cámara); mantener el botón presionado equivale al puño
addEventListener('mousemove', (e) => moverPuntero(e.clientX, e.clientY, e.buttons > 0));
addEventListener('mousedown', (e) => moverPuntero(e.clientX, e.clientY, true));
addEventListener('mouseup', (e) => moverPuntero(e.clientX, e.clientY, false));

addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }
  if (e.key.toLowerCase() === 'c') vistaCamara.classList.toggle('oculto');
  if (e.key === 'Escape') cerrarTarjeta();
});

function mostrarEstado(mensaje: string, tipo: 'info' | 'ok' | 'error' = 'info') {
  estado.textContent = mensaje;
  estado.dataset.tipo = tipo;
}

iniciarRastreo(video, document.getElementById('esqueleto') as HTMLCanvasElement, {
  onPosicion: (x, y, esPuno) => {
    vistaCamara.classList.add('con-mano');
    moverPuntero(x, y, esPuno);
  },
  onPerdida: () => {
    vistaCamara.classList.remove('con-mano');
    manoPerdida();
  },
  onEstado: mostrarEstado,
}).catch((err) => {
  console.error(err);
  vistaCamara.classList.add('oculto');
  mostrarEstado(err.message, 'error');
});
