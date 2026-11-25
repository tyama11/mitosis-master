import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(rootDir, 'src');
const outDir = join(rootDir, 'js');

mkdirSync(outDir, { recursive: true });

const tsFiles = readdirSync(srcDir).filter((file) => file.endsWith('.ts'));

for (const file of tsFiles) {
    const srcPath = join(srcDir, file);
    const outPath = join(outDir, file.replace(/\.ts$/, '.js'));
    const source = readFileSync(srcPath, 'utf8');
    const stripped = stripTypeScriptTypes(source, { mode: 'strip', sourceUrl: file });
    const rewritten = stripped.replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2');
    writeFileSync(outPath, rewritten, 'utf8');
}

console.log(`Built ${tsFiles.length} TypeScript files into js/`);
