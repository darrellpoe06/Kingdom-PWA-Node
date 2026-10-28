// The hooks behind register-json-imports.mjs, so plain node can import the
// app's modules the way vite does: a .json module is JSON, attribute or not,
// and a relative import without an extension finds its .js file.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/i.test(specifier) && context.parentURL) {
    const base = new URL(specifier, context.parentURL);
    for (const tail of ['.js', '.jsx', '/index.js']) {
      const candidate = new URL(base.href + tail);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
  }
  return nextResolve(specifier, context);
}

// A .json file becomes a module with a default export AND a named export per
// top-level key (vite allows `import { courses } from './x.json'`; node's own
// JSON modules have only a default).
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const data = JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
    const names = data && typeof data === 'object' && !Array.isArray(data)
      ? Object.keys(data).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k))
      : [];
    const source = `const data = ${JSON.stringify(data)};\nexport default data;\n${names.map((k) => `export const ${k} = data[${JSON.stringify(k)}];`).join('\n')}\n`;
    return { format: 'module', shortCircuit: true, source };
  }
  return nextLoad(url, context);
}
