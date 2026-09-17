/**
 * Résolveur de modules pour l'exécution des scripts TypeScript par Node.
 *
 * Node sait retirer les annotations de type (`--experimental-strip-types`) mais
 * ignore l'alias `@/` du tsconfig et exige des extensions explicites. Ce hook
 * comble les deux manques, uniquement pour les scripts de maintenance.
 */
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.mjs', '.json'];

function withExtension(basePath) {
  if (existsSync(basePath) && statSync(basePath).isFile()) return basePath;

  for (const extension of EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    if (existsSync(candidate)) return candidate;
  }

  for (const extension of EXTENSIONS) {
    const candidate = resolvePath(basePath, `index${extension}`);
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const target = withExtension(resolvePath(ROOT, specifier.slice(2)));
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }

  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const parentDirectory = dirname(fileURLToPath(context.parentURL));
    const target = withExtension(resolvePath(parentDirectory, specifier));
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
