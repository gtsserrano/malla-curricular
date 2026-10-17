import { DrawingUtils, FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const CDN_MODELO =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Si se ejecutó `npm run offline`, los archivos están en public/mediapipe (útil si el stand no tiene internet)
const LOCAL_WASM = 'mediapipe/wasm';
const LOCAL_MODELO = 'mediapipe/hand_landmarker.task';

// ---------- Ajustes ----------
/** Punto de la mano que mueve el puntero: 8 = punta del dedo índice */
const PUNTO_PUNTERO = 8;
/** Zona activa: no hace falta llevar la mano hasta el borde de la cámara para llegar al borde de la pantalla */
const MARGEN = 0.15;
/**
 * Tamaño mínimo de la mano (distancia muñeca–nudillo medio, en proporción de la imagen).
 * Ignora manos pequeñas, es decir, personas que pasan lejos detrás de quien está usando la malla.
 */
const TAMANO_MINIMO_MANO = 0.07;
/** Suavizado (filtro One Euro): menos MIN_CUTOFF = más estable; más BETA = más rápido al moverse */
const MIN_CUTOFF = 1.2;
const BETA = 0.02;

/** Frames seguidos con el puño cerrado para confirmar el gesto (~0,2 s, evita falsos positivos) */
const FRAMES_PUNO = 6;

export interface Callbacks {
  /** `puno` = true mientras la mano está cerrada en puño */
  onPosicion: (x: number, y: number, puno: boolean) => void;
  onPerdida: () => void;
  onEstado: (mensaje: string, tipo?: 'info' | 'ok' | 'error') => void;
}

/**
 * Filtro One Euro: elimina el temblor cuando la mano está quieta
 * pero responde rápido cuando se mueve. https://gery.casiez.net/1euro/
 */
class FiltroOneEuro {
  private x: number | null = null;
  private dx = 0;
  private t = 0;

  filtrar(valor: number, tiempo: number) {
    if (this.x === null) {
      this.x = valor;
      this.t = tiempo;
      return valor;
    }
    const dt = Math.max((tiempo - this.t) / 1000, 1e-3);
    this.t = tiempo;
    const alfa = (corte: number) => 1 / (1 + 1 / (2 * Math.PI * corte * dt));
    const dxActual = (valor - this.x) / dt;
    this.dx += alfa(1) * (dxActual - this.dx);
    this.x += alfa(MIN_CUTOFF + BETA * Math.abs(this.dx)) * (valor - this.x);
    return this.x;
  }

  reiniciar() {
    this.x = null;
    this.dx = 0;
  }
}

async function existe(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && !r.headers.get('content-type')?.includes('text/html');
  } catch {
    return false;
  }
}

async function crearDetector() {
  const local = await existe(LOCAL_MODELO);
  const vision = await FilesetResolver.forVisionTasks(local ? LOCAL_WASM : CDN_WASM);
  const opciones = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: local ? LOCAL_MODELO : CDN_MODELO, delegate },
    runningMode: 'VIDEO' as const,
    numHands: 1, // solo una mano controla el puntero
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
  try {
    return await HandLandmarker.createFromOptions(vision, opciones('GPU'));
  } catch (e) {
    console.warn('GPU no disponible, usando CPU', e);
    return await HandLandmarker.createFromOptions(vision, opciones('CPU'));
  }
}

function mensajeErrorCamara(err: unknown) {
  const nombre = (err as DOMException)?.name;
  if (!window.isSecureContext) return 'La cámara solo funciona abriendo la página en http://localhost';
  if (nombre === 'NotAllowedError') return 'Permiso de cámara denegado: haz clic en el ícono de cámara de la barra de direcciones y permite el acceso';
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No se encontró ninguna cámara conectada';
  if (nombre === 'NotReadableError') return 'La cámara está ocupada por otra aplicación (Zoom, Teams, OBS…). Ciérrala y recarga';
  return 'No se pudo iniciar la cámara: ' + ((err as Error)?.message ?? err);
}

async function abrirCamara(video: HTMLVideoElement) {
  try {
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
  } catch (err) {
    throw new Error(mensajeErrorCamara(err));
  }
  await video.play();
}

/** Tamaño aparente de la mano: distancia entre la muñeca (0) y el nudillo del dedo medio (9) */
function tamanoMano(mano: NormalizedLandmark[]) {
  return Math.hypot(mano[0].x - mano[9].x, mano[0].y - mano[9].y);
}

/**
 * Puño cerrado: el índice doblado y al menos 2 de los otros 3 dedos (medio, anular, meñique).
 * Se exige el índice para que el gesto de APUNTAR (índice estirado, resto doblado) no cuente como puño.
 * Un dedo está doblado si su punta queda más cerca de la muñeca que su articulación media.
 */
export function esPuno(mano: NormalizedLandmark[]) {
  const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const doblado = (punta: number, articulacion: number) => dist(mano[punta], mano[0]) < dist(mano[articulacion], mano[0]);
  const otros = [doblado(12, 10), doblado(16, 14), doblado(20, 18)].filter(Boolean).length;
  return doblado(8, 6) && otros >= 2;
}

/**
 * Enciende la cámara, detecta UNA mano y entrega la posición de la punta del dedo índice
 * en coordenadas de pantalla (píxeles), suavizada y en espejo.
 * Dibuja el esqueleto de la mano sobre `lienzo` para que el visitante vea que fue detectado.
 */
export async function iniciarRastreo(video: HTMLVideoElement, lienzo: HTMLCanvasElement, cb: Callbacks) {
  cb.onEstado('Cargando detector de manos y cámara…');
  // El modelo y la cámara se preparan en paralelo
  const [detector] = await Promise.all([crearDetector(), abrirCamara(video)]);

  lienzo.width = video.videoWidth;
  lienzo.height = video.videoHeight;
  const ctx = lienzo.getContext('2d')!;
  const dibujo = new DrawingUtils(ctx);

  const filtroX = new FiltroOneEuro();
  const filtroY = new FiltroOneEuro();
  let ultimoTiempo = -1;
  let habiaMano = false;
  let framesPuno = 0;
  let ultimaX = innerWidth / 2;
  let ultimaY = innerHeight / 2;

  cb.onEstado('Levanta una mano frente a la cámara 👋', 'ok');

  const bucle = () => {
    requestAnimationFrame(bucle);
    if (video.readyState < 2 || video.currentTime === ultimoTiempo) return;
    ultimoTiempo = video.currentTime;

    const ahora = performance.now();
    const res = detector.detectForVideo(video, ahora);
    const mano = res.landmarks[0];
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);

    if (!mano || tamanoMano(mano) < TAMANO_MINIMO_MANO) {
      if (habiaMano) {
        filtroX.reiniciar();
        filtroY.reiniciar();
        habiaMano = false;
      }
      framesPuno = 0;
      cb.onPerdida();
      return;
    }
    habiaMano = true;

    framesPuno = esPuno(mano) ? framesPuno + 1 : 0;
    const puno = framesPuno >= FRAMES_PUNO;
    // Mientras se va cerrando la mano el índice se dobla: el puntero se congela para que no salte
    const cerrando = framesPuno > 0;

    // Esqueleto en la vista previa (rojo cuando la mano está en puño)
    const color = puno ? '#ff5252' : '#ffffff';
    dibujo.drawConnectors(mano, HandLandmarker.HAND_CONNECTIONS, { color, lineWidth: 3 });
    dibujo.drawLandmarks(mano, { color: '#2f8a3c', fillColor: color, radius: 3, lineWidth: 1 });
    if (!cerrando) {
      dibujo.drawLandmarks([mano[PUNTO_PUNTERO]], { color: '#000000', fillColor: '#ffd400', radius: 7, lineWidth: 2 });
    }

    if (!cerrando) {
      // La cámara está en espejo: mover la mano a la derecha mueve el puntero a la derecha
      const p = mano[PUNTO_PUNTERO];
      const nx = Math.min(1, Math.max(0, (1 - p.x - MARGEN) / (1 - 2 * MARGEN)));
      const ny = Math.min(1, Math.max(0, (p.y - MARGEN) / (1 - 2 * MARGEN)));
      ultimaX = filtroX.filtrar(nx * innerWidth, ahora);
      ultimaY = filtroY.filtrar(ny * innerHeight, ahora);
    }
    cb.onPosicion(ultimaX, ultimaY, puno);
  };
  bucle();
}
