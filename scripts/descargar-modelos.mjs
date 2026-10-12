// Copia los archivos de MediaPipe a public/ para que la app funcione SIN internet en el stand.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';

const destino = 'public/mediapipe';
mkdirSync(destino, { recursive: true });

cpSync('node_modules/@mediapipe/tasks-vision/wasm', `${destino}/wasm`, { recursive: true });
console.log('✔ WASM copiado');

const url =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const res = await fetch(url);
if (!res.ok) throw new Error(`No se pudo descargar el modelo: ${res.status}`);
writeFileSync(`${destino}/hand_landmarker.task`, Buffer.from(await res.arrayBuffer()));
console.log('✔ Modelo de manos descargado');
