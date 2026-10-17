import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './styles.css';
import datos from './data/malla.json';
import type { Malla } from './types';
import { ajustarTextos, renderMalla } from './malla';
import { abrirTarjeta, cerrarTarjeta, idAbierto } from './tarjeta3d';
import { iniciarRastreo } from './rastreoMano';

const malla = datos as Malla;
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
const activarCamara = document.getElementById('activar-camara') as HTMLButtonElement;

// Tiempo que hay que mantener el puntero sobre una materia para abrirla (evita aperturas accidentales)
const TIEMPO_ESPERA_MS = 2000;
// Una vez elegido un cuadro, el puntero puede salirse hasta estos píxeles del borde sin perder la carga
// (absorbe el temblor de la mano y las líneas blancas entre cuadros)
const TOLERANCIA_PX = 30;
// Salidas breves del cuadro o pérdidas momentáneas de la mano no reinician la carga
const GRACIA_MS = 400;

const celdas = [...document.querySelectorAll<HTMLElement>('.materia')];

document.getElementById('tablero')!.addEventListener('click', (e) => {
  const celda = (e.target as HTMLElement).closest<HTMLElement>('.materia');
  if (celda && !idAbierto()) {
    elegir(null, performance.now());
    abrirTarjeta(celda, malla);
  }
});

document.getElementById('tablero')!.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const celda = (e.target as HTMLElement).closest<HTMLElement>('.materia');
  if (!celda || idAbierto()) return;
  e.preventDefault();
  elegir(null, performance.now());
  abrirTarjeta(celda, malla);
});

document.getElementById('capa-tarjeta')!.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('#cerrar-tarjeta')) {
    cerrarTarjeta();
    elegir(null, performance.now());
    manoPerdida();
  }
});

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

// El mouse también puede apuntar; el clic abre y el botón × o Escape cierran.
// El puño se reserva para la mano detectada por cámara, para evitar que un clic cierre la tarjeta antes de tiempo.
addEventListener('mousemove', (e) => {
  if (!idAbierto()) moverPuntero(e.clientX, e.clientY);
});

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

let iniciandoCamara = false;
let camaraActiva = false;

async function iniciarCamara() {
  if (iniciandoCamara || camaraActiva) return;
  iniciandoCamara = true;
  activarCamara.hidden = true;
  try {
    await iniciarRastreo(video, document.getElementById('esqueleto') as HTMLCanvasElement, {
      onPosicion: (x, y, esPuno) => {
        if (!vistaCamara.classList.contains('con-mano')) {
          mostrarEstado('Mantén el dedo sobre una materia 2 segundos · Cierra el puño para volver', 'ok');
        }
        vistaCamara.classList.add('con-mano');
        moverPuntero(x, y, esPuno);
      },
      onPerdida: () => {
        if (vistaCamara.classList.contains('con-mano')) {
          mostrarEstado('Levanta una mano frente a la cámara 👋', 'ok');
        }
        vistaCamara.classList.remove('con-mano');
        manoPerdida();
      },
      onEstado: mostrarEstado,
    });
    camaraActiva = true;
    vistaCamara.classList.remove('oculto');
  } catch (err) {
    console.error(err);
    vistaCamara.classList.add('oculto');
    mostrarEstado((err as Error).message, 'error');
    activarCamara.hidden = false;
  } finally {
    iniciandoCamara = false;
  }
}

activarCamara.addEventListener('click', iniciarCamara);
void iniciarCamara();
