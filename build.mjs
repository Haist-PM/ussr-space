import {mkdir,readFile,writeFile,copyFile,cp,rm} from 'node:fs/promises';
import {build} from 'esbuild';
import {Script} from 'node:vm';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/entry.js'],bundle:true,minify:true,format:'iife',target:['es2020'],outfile:'dist/museum.js',legalComments:'eof'});
for(const name of ['index.html','style.css'])await copyFile(name,`dist/${name}`);
await cp('assets','dist/assets',{recursive:true});
await writeFile('dist/.nojekyll','');
const html=await readFile('index.html','utf8'),css=await readFile('style.css','utf8'),js=await readFile('dist/museum.js','utf8');
const embedded={};for(const name of ['earth-day.jpg','earth-clouds.jpg'])embedded[name]='data:image/jpeg;base64,'+(await readFile('assets/'+name)).toString('base64');
await writeFile('dist/Открыть-сайт.html',html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`).replace('<script defer src="museum.js"></script>','').replace('</body>',()=>`<script>window.__MUSEUM_ASSETS__=${JSON.stringify(embedded)};</script><script>${js.replaceAll('</script>','<\\/script>')}</script></body>`));
// Validate inline scripts after HTML embedding, catching replacement-string corruption.
const standalone=await readFile('dist/Открыть-сайт.html','utf8');
for(const match of standalone.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(match[1]);
// Keep the existing local server workflow; it serves the current bundled source.
await copyFile('dist/museum.js','museum.js');
await rm('dist/app.js',{force:true});
console.log(`Сборка готова. WebGL bundle: ${(Buffer.byteLength(js)/1024).toFixed(0)} КБ. Текстуры локальные; автономный HTML сохранён.`);
