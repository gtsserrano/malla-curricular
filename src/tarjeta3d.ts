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
const lista = (items: string[]) => items.map((t) => `<li>${escapar(t)}</li>`).join('');

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
      <h3>${escapar(m.nombre)}</h3>
    </header>
    <figure class="foto">
      <img src="${escapar(imagenMateria(m))}" alt="${escapar(m.nombre)}" />
      <div class="reserva">${m.icono ?? '📘'}</div>
    </figure>
    <div class="info">
      <p class="datos-plan">${m.sigla ? `${escapar(m.sigla)} · ` : ''}${m.creditos} créditos · ${m.horasTeoricas} h teóricas y ${m.horasPracticas} h prácticas por semana</p>
      <section><h4>De qué trata</h4><p class="descripcion">${escapar(m.descripcion ?? '')}</p></section>
      ${m.temas?.length ? `<section><h4>Contenidos mínimos</h4><ul>${lista(m.temas)}</ul></section>` : ''}
      ${
        m.herramientas?.length
          ? `<section><h4>Herramientas</h4><div class="chips">${m.herramientas.map((h) => `<span>${escapar(h)}</span>`).join('')}</div></section>`
          : ''
      }
    </div>
    <div class="pista">✊ Cierra el puño para cerrar</div>`;
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
