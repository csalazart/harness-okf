#!/usr/bin/env node
/**
 * okf-link-skills.js — Publica los skills okf-* en las carpetas de skills de
 * los agentes IA del proyecto (.claude/skills, .gemini/skills, .agents/skills).
 *
 * USO: node .harness/scripts/okf-link-skills.js [--copy]
 *   --copy   fuerza copia de ficheros (sin enlaces) en todos los agentes
 *
 * Fuente de verdad: .harness/skills/okf-<nombre>/SKILL.md
 * (si encuentra el formato plano .harness/skills/okf-<nombre>.md lo normaliza
 *  automáticamente a carpeta/SKILL.md antes de enlazar)
 *
 * Estrategia por agente detectado:
 *   1. <agente>/skills es ya un enlace a .harness/skills  → nada que hacer
 *      (caso harness-kit: nuestros skills ya son visibles a través del enlace).
 *   2. <agente>/skills no existe                          → enlace por skill.
 *   3. <agente>/skills existe como carpeta real           → enlace POR SKILL
 *      dentro de ella, sin tocar los skills ajenos.
 *
 * Enlaces según plataforma:
 *   - Windows: junction de directorio (NO requiere administrador ni Developer
 *     Mode). Si falla → copia.
 *   - macOS/Linux: symlink normal. Si falla → copia.
 *   - La copia funciona siempre, pero no se sincroniza sola: re-ejecuta este
 *     script tras modificar un skill.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FORCE_COPY = process.argv.includes('--copy');

// ROOT del proyecto: este script vive en <proyecto>/.harness/scripts/
let ROOT = __dirname.replace(/[\\/]\.harness[\\/]scripts$/, '');
if (ROOT === __dirname) ROOT = process.cwd(); // ejecutado desde otro sitio

const SRC = path.join(ROOT, '.harness', 'skills');

const AGENTS = [
  { name: 'Claude Code', root: '.claude' },
  { name: 'Gemini', root: '.gemini' },
  { name: 'Estándar (.agents)', root: '.agents' },
];

function log(msg) { console.log('  ' + msg); }

// ── 0. fuente ────────────────────────────────────────────────
if (!fs.existsSync(SRC)) {
  console.log('⚠️  No existe .harness/skills/ — instala primero el cerebro (prompts/01_init.md).');
  process.exit(1);
}

// Normalizar formato plano okf-*.md → okf-*/SKILL.md
for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (entry.isFile() && /^okf-.+\.md$/i.test(entry.name)) {
    const name = entry.name.replace(/\.md$/i, '');
    const dir = path.join(SRC, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(path.join(SRC, entry.name), path.join(dir, 'SKILL.md'));
    log(`🔧 normalizado: skills/${entry.name} → skills/${name}/SKILL.md`);
  }
}

// Skills okf-* disponibles (carpetas con SKILL.md)
const skills = fs.readdirSync(SRC, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^okf-/.test(e.name)
    && fs.existsSync(path.join(SRC, e.name, 'SKILL.md')))
  .map((e) => e.name);

if (skills.length === 0) {
  console.log('⚠️  No hay skills okf-* en .harness/skills/ — nada que publicar.');
  process.exit(1);
}

console.log('\n════════════════════════════════════════════');
console.log('  OKF LINK SKILLS');
console.log('════════════════════════════════════════════');
log(`Skills: ${skills.join(', ')}`);

// ── helpers ──────────────────────────────────────────────────
function isLinkTo(linkPath, expectedTarget) {
  try {
    const st = fs.lstatSync(linkPath);
    if (!st.isSymbolicLink()) return false;
    const resolved = path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath));
    return path.resolve(resolved) === path.resolve(expectedTarget);
  } catch { return false; }
}

function linkOrCopyDir(srcDir, destDir) {
  if (!FORCE_COPY) {
    try {
      const type = process.platform === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(srcDir, destDir, type);
      return 'enlace';
    } catch (_) { /* fallback copia */ }
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, e.name);
    const d = path.join(destDir, e.name);
    if (e.isDirectory()) linkOrCopyDirPlain(s, d);
    else fs.copyFileSync(s, d);
  }
  return 'copia';
}
function linkOrCopyDirPlain(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, e.name);
    const d = path.join(destDir, e.name);
    if (e.isDirectory()) linkOrCopyDirPlain(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ── 1. agentes ───────────────────────────────────────────────
const active = AGENTS.filter((a) => fs.existsSync(path.join(ROOT, a.root)));
if (active.length === 0) {
  log('ℹ️  No se detectó .claude/, .gemini/ ni .agents/ en el proyecto.');
  log('💡 Crea la carpeta de tu agente (ej. mkdir .claude) y re-ejecuta.');
  console.log('════════════════════════════════════════════\n');
  process.exit(0);
}

let usedCopy = false;
let failed = 0;

for (const agent of active) {
  const skillsDir = path.join(ROOT, agent.root, 'skills');
  console.log(`\n  ${agent.name} (${agent.root}/skills/)`);

  // Caso 1: la carpeta entera ya es un enlace a .harness/skills (harness-kit)
  if (isLinkTo(skillsDir, SRC)) {
    log(`✅ ya enlazada entera a .harness/skills — los okf-* son visibles`);
    continue;
  }

  fs.mkdirSync(skillsDir, { recursive: true });

  // Casos 2 y 3: enlace/copia por skill, sin tocar skills ajenos
  for (const name of skills) {
    const src = path.join(SRC, name);
    const dest = path.join(skillsDir, name);
    if (isLinkTo(dest, src)) { log(`✅ ${name}: ya enlazado`); continue; }
    if (fs.existsSync(dest)) { log(`ℹ️  ${name}: ya existe (se conserva)`); continue; }
    try {
      const method = linkOrCopyDir(src, dest);
      if (method === 'copia') usedCopy = true;
      log(`✅ ${name}: ${method}`);
    } catch (err) {
      log(`❌ ${name}: falló (${err.message})`);
      failed++;
    }
  }
}

console.log('\n════════════════════════════════════════════');
if (usedCopy) {
  log('⚠️  Se usó COPIA en algún agente: no se sincroniza sola.');
  log('   Re-ejecuta este script si modificas un skill.');
  if (process.platform === 'win32') {
    log('   (Windows: las junctions no requieren admin; si fallaron,');
    log('    revisa permisos de la carpeta o antivirus.)');
  }
}
console.log(failed === 0
  ? `  ✅ [SKILLS OK] ${skills.length} skill(s) publicados en ${active.length} agente(s)`
  : `  ❌ [SKILLS PARCIAL] ${failed} fallo(s) — revisa arriba`);
console.log('════════════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
