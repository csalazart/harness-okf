#!/usr/bin/env node
/**
 * okf-check.js — Validador de conformance del cerebro OKF (harness-okf).
 * Node puro, sin dependencias. Uso:
 *   node okf-check.js [--root <ruta-al-cerebro>] [--max-age-days <n>]
 *
 * Por defecto busca el cerebro en ./.harness/llm-wiki (o, si se ejecuta desde
 * dentro de .harness/, en ./llm-wiki).
 *
 * Errores (rompen conformance, exit 1):
 *   E1  falta index.md o log.md en la raíz del cerebro
 *   E2  página .md sin frontmatter YAML o sin campo type:
 *   E3  link Markdown relativo que no resuelve a un fichero existente
 *   E4  página huérfana (sin ningún link entrante)
 *   E5  placeholder {{...}} sin rellenar (instalación incompleta)
 * Avisos (no rompen, se listan):
 *   W1  página no enlazada desde ningún index.md (solo links entrantes de otras páginas)
 *   W2  página con tag `volatil` cuyo timestamp supera --max-age-days (defecto 30)
 *
 * La carpeta _templates/ se excluye de todas las comprobaciones.
 * Salida: [OKF OK] (exit 0) o [OKF FAIL] (exit 1).
 */
'use strict';
const fs = require('fs');
const path = require('path');

// --- argumentos ---
const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}
const maxAgeDays = parseInt(argVal('--max-age-days', '30'), 10);

let root = argVal('--root', null);
if (!root) {
  const candidates = [
    path.join(process.cwd(), '.harness', 'llm-wiki'),
    path.join(process.cwd(), 'llm-wiki'),
    process.cwd(), // se ejecuta desde dentro del cerebro
  ];
  root = candidates.find((c) => fs.existsSync(path.join(c, 'index.md')) || fs.existsSync(path.join(c, 'SCHEMA.md')));
  if (!root) {
    console.error('[OKF FAIL] No se encontró el cerebro. Usa --root <ruta a llm-wiki>.');
    process.exit(1);
  }
}
root = path.resolve(root);

const errors = [];
const warnings = [];
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');

// --- recolectar .md (excluyendo _templates/) ---
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_templates' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}
const files = walk(root, []);

// E1 — reservados en raíz
for (const reserved of ['index.md', 'log.md']) {
  if (!fs.existsSync(path.join(root, reserved))) {
    errors.push(`E1  falta ${reserved} en la raíz del cerebro`);
  }
}

// --- parseo por fichero ---
const inboundLinks = new Map(); // destino (ruta absoluta) -> [origenes]
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const relFile = rel(file);

  // E2 — frontmatter con type:
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    errors.push(`E2  ${relFile}: sin frontmatter YAML`);
  } else if (!/^type:\s*\S+/m.test(fmMatch[1])) {
    errors.push(`E2  ${relFile}: frontmatter sin campo type:`);
  }

  // E5 — placeholders sin rellenar
  if (/\{\{[A-Z0-9_]+\}\}/.test(text)) {
    errors.push(`E5  ${relFile}: contiene placeholders {{...}} sin rellenar`);
  }

  // E3 — links relativos resolubles + registro de entrantes
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    let target = m[1];
    if (/^(https?:|mailto:|#)/i.test(target)) continue; // externos y anclas
    target = target.split('#')[0];
    if (!target || !/\.md$/i.test(target)) continue; // solo comprobamos .md
    try { target = decodeURIComponent(target); } catch (_) { /* tal cual */ }
    const abs = target.startsWith('/')
      ? path.join(root, target)
      : path.resolve(path.dirname(file), target);
    if (!fs.existsSync(abs)) {
      errors.push(`E3  ${relFile}: link roto → ${m[1]}`);
    } else {
      const key = path.resolve(abs);
      if (!inboundLinks.has(key)) inboundLinks.set(key, []);
      inboundLinks.get(key).push(relFile);
    }
  }

  // W2 — volátiles caducadas
  if (fmMatch) {
    const fm = fmMatch[1];
    const isVolatil = /^tags:.*volatil/m.test(fm);
    if (isVolatil) {
      const ts = fm.match(/^timestamp:\s*(\S+)/m);
      if (!ts) {
        warnings.push(`W2  ${relFile}: tag volatil sin timestamp`);
      } else {
        const ageDays = (Date.now() - Date.parse(ts[1])) / 86400000;
        if (isNaN(ageDays)) {
          warnings.push(`W2  ${relFile}: timestamp no parseable (${ts[1]})`);
        } else if (ageDays > maxAgeDays) {
          warnings.push(`W2  ${relFile}: dato volatil con ${Math.floor(ageDays)} días (máx ${maxAgeDays}) — verificar`);
        }
      }
    }
  }
}

// E4 / W1 — huérfanas (los reservados y de configuración no cuentan como página)
const EXEMPT = new Set(['index.md', 'log.md', 'README.md', 'SCHEMA.md']);
for (const file of files) {
  const base = path.basename(file);
  if (EXEMPT.has(base)) continue;
  const origins = inboundLinks.get(path.resolve(file)) || [];
  if (origins.length === 0) {
    errors.push(`E4  ${rel(file)}: página huérfana (ningún link entrante)`);
  } else if (!origins.some((o) => path.basename(o) === 'index.md')) {
    warnings.push(`W1  ${rel(file)}: no enlazada desde ningún index.md (solo desde: ${origins.join(', ')})`);
  }
}

// --- salida ---
console.log(`Cerebro: ${root}`);
console.log(`Ficheros .md analizados: ${files.length}\n`);
if (warnings.length) {
  console.log('Avisos:');
  for (const w of warnings) console.log('  ' + w);
  console.log('');
}
if (errors.length) {
  console.log('Errores:');
  for (const e of errors) console.log('  ' + e);
  console.log(`\n[OKF FAIL] ${errors.length} error(es), ${warnings.length} aviso(s)`);
  process.exit(1);
}
console.log(`[OKF OK] 0 errores, ${warnings.length} aviso(s)`);
process.exit(0);
