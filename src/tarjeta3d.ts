import { colorSemestre, idMateria, imagenMateria, ORDINALES, urlsGif, type Malla, type Materia } from './types';

const capa = document.getElementById('capa-tarjeta')!;
const tarjeta = document.getElementById('tarjeta')!;
const frente = tarjeta.querySelector<HTMLElement>('.frente')!;
const reverso = tarjeta.querySelector<HTMLElement>('.reverso')!;

let abierta: string | null = null;

export function idAbierto() {
  return abierta;
}

const lista = (items: string[]) => items.map((t) => `<li>${t}</li>`).join('');

/** "MC120-MC110" -> "Cálculo I y Fundamentos de Matemática" (si la sigla no está en la malla, se deja la sigla) */
function nombresRequisitos(requisitos: string, malla: Malla) {
  const nombres = requisitos
    .split('-')
    .filter(Boolean)
    .map((sigla) => malla.materias.find((x) => x.sigla === sigla)?.nombre ?? sigla);
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0];
}

function fichaTecnica(m: Materia, malla: Malla) {
  const datos = [
    m.sigla,
    m.creditos ? `${m.creditos} créditos` : '',
    m.horasTeoricas + m.horasPracticas ? `${m.horasTeoricas + m.horasPracticas} h/semana` : '',
    m.requisitos ? `Requisito: ${nombresRequisitos(m.requisitos, malla)}` : 'Sin requisitos',
  ];
  return datos
    .filter(Boolean)
    .map((d) => `<span>${d}</span>`)
    .join('');
}

/** Reduce la letra de la información (hasta un 65 %) solo si no cabe en la tarjeta */
function ajustarInfo() {
  const info = reverso.querySelector<HTMLElement>('.info')!;
  info.style.fontSize = '';
  const base = parseFloat(getComputedStyle(info).fontSize);
  for (let escala = 1; escala >= 0.65 && info.scrollHeight > info.clientHeight + 1; escala -= 0.05) {
    info.style.fontSize = `${base * escala}px`;
  }
}

/** URL del GIF que ya se comprobó que funciona (local o CDN), por emoji */
const gifListo = new Map<string, string>();

/** Prueba las URLs del GIF en orden (local → CDN) sobre `img`; si ninguna carga, llama a `alFallar` */
function cargarGif(img: HTMLImageElement, emoji: string, alFallar = () => {}) {
  const urls = gifListo.has(emoji) ? [gifListo.get(emoji)!] : urlsGif(emoji);
  let intento = 0;
  img.onload = () => gifListo.set(emoji, urls[intento]);
  img.onerror = () => {
    intento++;
    if (intento < urls.length) img.src = urls[intento];
    else alFallar();
  };
  img.src = urls[0];
}

/**
 * Empieza a descargar el GIF de una materia mientras el puntero se carga sobre ella,
 * así la animación ya está lista cuando se abre la tarjeta.
 */
export function precargarGif(celda: HTMLElement, malla: Malla) {
  const m = malla.materias.find((x) => idMateria(x) === celda.dataset.id);
  const emoji = m?.icono ?? '📚';
  if (m && !gifListo.has(emoji)) cargarGif(new Image(), emoji);
}

/** Coloca el GIF animado del ícono; si no carga (sin internet ni copia local), deja el emoji normal */
function ponerGif(contenedor: HTMLElement, emoji: string) {
  const gif = document.createElement('img');
  gif.className = 'gif';
  gif.alt = '';
  cargarGif(gif, emoji, () => (contenedor.textContent = emoji));
  contenedor.replaceChildren(gif);
}

/**
 * Abre la tarjeta partiendo de la posición del cuadro (técnica FLIP):
 * el cuadro "sale" de la malla, viaja al centro y gira 180° mostrando la foto y la información.
 */
export function abrirTarjeta(celda: HTMLElement, malla: Malla) {
  const m = malla.materias.find((x) => idMateria(x) === celda.dataset.id);
  if (!m) return;
  abierta = celda.dataset.id!;

  tarjeta.style.setProperty('--color', colorSemestre(m.semestre));
  frente.textContent = m.nombre;
  reverso.innerHTML = `
    <header>
      <span class="semestre">${ORDINALES[m.semestre - 1] ?? m.semestre + '°'} Semestre</span>
      <h3>${m.nombre}</h3>
      <div class="ficha">${fichaTecnica(m, malla)}</div>
    </header>
    <figure class="foto">
      <img src="${imagenMateria(m)}" alt="${m.nombre}" />
      <div class="reserva"></div>
    </figure>
    <div class="info">
      <p class="descripcion">${m.descripcion}</p>
      <section>
        <h4>¿Qué aprenderás?</h4>
        <ul>${lista(m.temas)}</ul>
      </section>
      <section>
        <h4>¿Para qué te sirve?</h4>
        <p>${m.utilidad}</p>
      </section>
      ${
        m.herramientas?.length
          ? `<section><h4>Herramientas</h4><div class="chips">${m.herramientas.map((h) => `<span>${h}</span>`).join('')}</div></section>`
          : ''
      }
    </div>
    <div class="pista">✊ Cierra el puño para cerrar</div>`;
  // Si la foto aún no existe, se muestra el GIF animado de la materia sobre fondo verde
  const foto = reverso.querySelector<HTMLElement>('.foto')!;
  foto.querySelector('img')!.onerror = () => {
    foto.classList.add('sin-foto');
    ponerGif(foto.querySelector<HTMLElement>('.reserva')!, m.icono ?? '📚');
  };
  ajustarInfo();

  // Posición inicial = el cuadro de la malla
  capa.classList.add('visible');
  tarjeta.style.transition = 'none';
  tarjeta.style.transform = 'none';
  const destino = tarjeta.getBoundingClientRect();
  const origen = celda.getBoundingClientRect();
  const dx = origen.left + origen.width / 2 - (destino.left + destino.width / 2);
  const dy = origen.top + origen.height / 2 - (destino.top + destino.height / 2);
  const sx = origen.width / destino.width;
  const sy = origen.height / destino.height;
  tarjeta.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

  // Forzar reflow y animar hacia el centro con el giro
  void tarjeta.offsetWidth;
  tarjeta.style.transition = '';
  tarjeta.style.transform = 'translate(0, 0) scale(1) rotateY(180deg)';
}

export function cerrarTarjeta() {
  if (!abierta) return;
  abierta = null;
  capa.classList.remove('visible');
  tarjeta.style.transform = 'scale(0.6) rotateY(0deg)';
}
