// Copia a public/ todo lo que la app descarga de internet, para que funcione SIN conexión en el stand:
// el detector de manos de MediaPipe y los GIF animados de cada materia.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

async function descargar(url, archivo) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`);
  writeFileSync(archivo, Buffer.from(await res.arrayBuffer()));
}

// ---------- MediaPipe ----------
const destino = 'public/mediapipe';
mkdirSync(destino, { recursive: true });

cpSync('node_modules/@mediapipe/tasks-vision/wasm', `${destino}/wasm`, { recursive: true });
console.log('✔ WASM copiado');

await descargar(
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  `${destino}/hand_landmarker.task`,
);
console.log('✔ Modelo de manos descargado');

// ---------- GIF de las materias (Noto Animated Emoji, licencia CC BY 4.0) ----------
mkdirSync('public/gif', { recursive: true });
const { materias } = JSON.parse(readFileSync('src/data/malla.json', 'utf8'));
const codigos = new Set(
  materias.map((m) => m.icono ?? '📚').map((e) => [...e].map((c) => c.codePointAt(0).toString(16)).join('_')),
);
for (const codigo of codigos) {
  await descargar(`https://fonts.gstatic.com/s/e/notoemoji/latest/${codigo}/512.gif`, `public/gif/${codigo}.gif`);
}
console.log(`✔ ${codigos.size} GIF descargados`);
