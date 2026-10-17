# Malla Curricular Interactiva · UPSA

Mallas curriculares de **Ingeniería de Sistemas e Inteligencia Artificial (550)** e
**Ingeniería en Informática y Gestión Inteligente (590)**, en dos versiones:

| Versión | Página | Para qué |
| --- | --- | --- |
| **Stand** | `index.html?c=550` / `?c=590` | Pantalla completa controlada con la mano por la cámara |
| **Celular** | `movil.html?c=550` / `?c=590` | La que abren los códigos QR; se toca una materia para ver su tarjeta |

En ambas, cada materia abre una tarjeta 3D con su GIF animado, ficha oficial (sigla, créditos, horas, requisitos) e información.

## Códigos QR dinámicos

| Carrera | Dirección del QR |
| --- | --- |
| Sistemas e IA (550) | https://gtsserrano.github.io/malla-curricular/q/550/ |
| Informática y Gestión Inteligente (590) | https://gtsserrano.github.io/malla-curricular/q/590/ |

- Los archivos para imprimir están en [qr/](qr/): `imprimir.html` (las dos tarjetas en una hoja A4), `qr-XXX-tarjeta.svg` y `qr-XXX.png`.
- **Son dinámicos**: el QR apunta a `/q/<código>/`, que redirige a la malla. Para cambiar a dónde lleva,
  edita el destino en [public/q/550/index.html](public/q/550/index.html) o [public/q/590/index.html](public/q/590/index.html) y sube los cambios; el QR impreso sigue sirviendo.
- Para actualizar lo publicado: `npm run publicar`.
- Para regenerar las imágenes de los QR: `npm run qr`.

## Tecnologías

- **TypeScript + Vite**: la app corre en el navegador
- **MediaPipe Hand Landmarker**: detecta la mano y usa la punta del dedo índice como puntero
- **CSS 3D transforms**: la animación de la tarjeta
- **Docker**: Node y las dependencias viven en el contenedor

## Cómo ejecutar

```bash
docker compose up --build -V
```

(`-V` reinstala `node_modules` dentro del contenedor; úsalo siempre que cambie `package.json`.)

Abre **http://localhost:5173** en Chrome o Edge y permite el acceso a la cámara.

> La cámara la usa el **navegador de Windows**, no el contenedor. Por eso no hace falta pasar la webcam a Docker.

### Sin Docker (con Node.js instalado)

```bash
npm install        # instalar dependencias (solo la primera vez o si cambia package.json)
npm run dev        # servidor de desarrollo en http://localhost:5173
```

Otros comandos:

```bash
npm run build      # compilar a la carpeta dist/
npm run preview    # servir la versión compilada (http://localhost:4173)
npm run offline    # descargar los modelos de MediaPipe para usar sin internet
```

### Atajos

| Tecla | Acción |
| --- | --- |
| `F` | Pantalla completa |
| `C` | Mostrar/ocultar la vista de la cámara (oculta por defecto; la detección funciona igual) |
| `Esc` | Cerrar la tarjeta |
| `1` / `2` | Cambiar a Sistemas e IA (550) / Informática y Gestión Inteligente (590) |

El mouse también funciona como puntero, así puedes desarrollar sin cámara.

## Editar el contenido

- **Materias y descripciones**: [src/data/malla-550.json](src/data/malla-550.json) y [src/data/malla-590.json](src/data/malla-590.json). Cada semestre es una fila y las materias aparecen en el orden del archivo; `"semestre": 0` = electiva (solo se muestra en la versión del celular).
- **Agregar otra carrera**: crea su JSON y regístralo en [src/carreras.ts](src/carreras.ts).
- **Fotos**: [public/img/](public/img/). La lista de nombres que debe tener cada foto está en [public/img/LEEME.txt](public/img/LEEME.txt).
- **Colores y estilos**: [src/styles.css](src/styles.css)
- **Tiempos de apertura y cierre**: constantes al inicio de [src/main.ts](src/main.ts)
- **Detección de la mano**: ajustes al inicio de [src/rastreoMano.ts](src/rastreoMano.ts):
  - `MARGEN`: qué tanto hay que mover la mano para cruzar toda la pantalla
  - `TAMANO_MINIMO_MANO`: ignora manos lejanas (personas que pasan detrás)
  - `MIN_CUTOFF` / `BETA`: estabilidad vs. rapidez del puntero

## Modo sin internet (para el stand)

Por defecto el modelo de MediaPipe se descarga de internet. Para que funcione sin conexión:

```bash
docker compose exec app npm run offline
```

## Trabajar dentro del contenedor desde VS Code (opcional)

Instala la extensión **Dev Containers** y ejecuta *"Dev Containers: Reopen in Container"*.
