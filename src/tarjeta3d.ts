import { colorSemestre, idMateria, imagenMateria, ORDINALES, type Malla } from './types';

const capa = document.getElementById('capa-tarjeta')!;
const tarjeta = document.getElementById('tarjeta')!;
const frente = tarjeta.querySelector<HTMLElement>('.frente')!;
const reverso = tarjeta.querySelector<HTMLElement>('.reverso')!;

let abierta: string | null = null;

export function idAbierto() {
  return abierta;
}

const escapar = (texto: string) => texto.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]!);

const acentos: Record<string, string> = {
  MC: '#286a96', SC: '#2f8a3c', TR: '#147f83', MR: '#7059a3',
  BA: '#a56b2f', HH: '#a65368', ID: '#3887a6',
};

/**
 * Abre la tarjeta partiendo de la posición del cuadro (técnica FLIP):
 * el cuadro "sale" de la malla, viaja al centro y gira 180° mostrando la foto y la información.
 */
export function abrirTarjeta(celda: HTMLElement, malla: Malla) {
  const m = malla.materias.find((x) => idMateria(x) === celda.dataset.id);
  if (!m) return;
  abierta = celda.dataset.id!;

  tarjeta.style.setProperty('--color', colorSemestre(m.semestre));
  tarjeta.style.setProperty('--acento', acentos[m.sigla?.slice(0, 2) ?? ''] ?? '#698144');
  frente.textContent = m.nombre;
  reverso.innerHTML = `
    <figure class="foto">
      <img src="${escapar(imagenMateria(m))}" alt="${escapar(m.nombre)}" />
      <div class="reserva" aria-hidden="true">
        <span class="poster-numero">${String(m.semestre).padStart(2, '0')}</span>
        <span class="poster-icono">${escapar(m.icono ?? '📘')}</span>
      </div>
    </figure>
    <div class="detalle">
      <button id="cerrar-tarjeta" type="button" aria-label="Cerrar tarjeta">×</button>
      <header>
        <span class="semestre">${ORDINALES[m.semestre - 1] ?? m.semestre + '°'} Semestre</span>
        <h3>${escapar(m.nombre)}</h3>
      </header>
      <div class="info">
        <p class="descripcion">${escapar(m.descripcion)}</p>
      </div>
      <div class="pista">✊ Cierra el puño, pulsa Escape o usa × para volver</div>
    </div>`;
  // Si la foto aún no existe, se muestra el ícono de la materia sobre fondo verde
  const foto = reverso.querySelector<HTMLElement>('.foto')!;
  foto.querySelector('img')!.onerror = () => foto.classList.add('sin-foto');

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
