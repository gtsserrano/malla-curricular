# Malla Curricular Interactiva

Malla curricular a pantalla completa controlada con la mano a través de la cámara.
Al mantener el puntero sobre una materia, su tarjeta se abre con un giro 3D y muestra información y una foto.

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
| `C` | Mostrar/ocultar la vista de la cámara |
| `Esc` | Cerrar la tarjeta |

El mouse también funciona como puntero, así puedes desarrollar sin cámara.

## Editar el contenido

- **Materias y descripciones**: [src/data/malla.json](src/data/malla.json). Cada semestre es una fila y las materias aparecen en el orden del archivo.
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
