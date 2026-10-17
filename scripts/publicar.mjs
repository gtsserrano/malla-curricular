// Publica la carpeta dist/ (ya compilada) en la rama gh-pages, que es la que sirve GitHub Pages.
// Uso: npm run publicar
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const remoto = execSync('git remote get-url origin').toString().trim();
const correr = (cmd) => execSync(cmd, { cwd: 'dist', stdio: 'inherit' });

writeFileSync('dist/.nojekyll', ''); // GitHub Pages sirve los archivos tal cual
correr('git init -q -b gh-pages');
correr('git add -A');
correr('git commit -q -m "Publicar sitio"');
correr(`git push -q -f ${remoto} gh-pages`);
console.log('✔ Publicado en https://gtsserrano.github.io/malla-curricular/');
