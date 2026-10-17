// Genera los códigos QR DINÁMICOS de cada carrera en la carpeta qr/.
// Cada QR apunta a una dirección fija (/q/<código>/) que redirige a la malla; el destino se cambia
// editando public/q/<código>/index.html, sin volver a imprimir el QR.
// Uso: npm run qr
import { mkdirSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const SITIO = 'https://gtsserrano.github.io/malla-curricular';
const VERDE = '#1f6b2d';

const CARRERAS = [
  { codigo: '550', nombre: ['Ingeniería de Sistemas', 'e Inteligencia Artificial'] },
  { codigo: '590', nombre: ['Ingeniería en Informática', 'y Gestión Inteligente'] },
];

mkdirSync('qr', { recursive: true });

const opciones = { errorCorrectionLevel: 'H', margin: 2, color: { dark: VERDE, light: '#ffffff' } };
const tarjetas = [];

for (const { codigo, nombre } of CARRERAS) {
  const url = `${SITIO}/q/${codigo}/`;

  // QR solo, en alta resolución (para pegar en afiches o presentaciones)
  await QRCode.toFile(`qr/qr-${codigo}.png`, url, { ...opciones, width: 1200 });

  // Tarjeta imprimible: título de la carrera + QR + instrucción
  const qrSvg = await QRCode.toString(url, { ...opciones, type: 'svg', margin: 0 });
  const interior = qrSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const tamaño = qrSvg.match(/viewBox="0 0 (\d+) \d+"/)[1];
  const tarjeta = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 820" width="600" height="820">
  <rect width="600" height="820" rx="36" fill="#ffffff"/>
  <rect width="600" height="190" rx="36" fill="${VERDE}"/>
  <rect y="150" width="600" height="40" fill="${VERDE}"/>
  <g font-family="Poppins, Segoe UI, Arial, sans-serif" fill="#ffffff" text-anchor="middle">
    <text x="300" y="58" font-size="20" font-weight="600" letter-spacing="3">UPSA · MALLA CURRICULAR</text>
    <text x="300" y="112" font-size="34" font-weight="700">${nombre[0]}</text>
    <text x="300" y="154" font-size="34" font-weight="700">${nombre[1]}</text>
  </g>
  <svg x="90" y="230" width="420" height="420" viewBox="0 0 ${tamaño} ${tamaño}" shape-rendering="crispEdges">${interior}</svg>
  <g font-family="Poppins, Segoe UI, Arial, sans-serif" text-anchor="middle">
    <text x="300" y="712" font-size="30" font-weight="700" fill="${VERDE}">📱 Escanéame</text>
    <text x="300" y="752" font-size="20" fill="#5b6470">y conoce todas las materias de la carrera</text>
    <text x="300" y="790" font-size="15" fill="#8a8f98">Plan ${codigo}</text>
  </g>
</svg>
`;
  writeFileSync(`qr/qr-${codigo}-tarjeta.svg`, tarjeta);
  tarjetas.push(tarjeta);
  console.log(`✔ QR ${codigo} → ${url}`);
}

// Hoja para imprimir las dos tarjetas juntas
writeFileSync(
  'qr/imprimir.html',
  `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>QR Mallas Curriculares · UPSA</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { margin: 0; display: flex; gap: 12mm; justify-content: center; align-items: center; min-height: 100vh; background: #eef2ea; }
  body > svg { width: 120mm; height: auto; filter: drop-shadow(0 4px 12px rgb(0 0 0 / 0.15)); }
  @media print { body { background: none; min-height: auto; } body > svg { filter: none; outline: 0.3mm solid #ccc; border-radius: 6mm; } }
</style>
</head>
<body>
${tarjetas.join('\n')}
</body>
</html>
`,
);
console.log('✔ qr/imprimir.html (las dos tarjetas en una hoja A4)');
