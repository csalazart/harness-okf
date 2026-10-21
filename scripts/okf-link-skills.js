#!/usr/bin/env node
/**
 * okf-link-skills.js — Instala los skills okf-* en la carpeta estándar
 * .agents/skills/okf/ y los publica en las carpetas de skills de los agentes
 * IA del proyecto (.claude/skills, .gemini/skills).
 *
 * USO:
 *   node .harness/scripts/okf-link-skills.js [--copy]
 *   node <harness-okf>/scripts/okf-link-skills.js [--copy]   (desde el proyecto)
 *     --copy   fuerza copia de ficheros (sin enlaces) en los agentes
 *
 * Fuente de verdad: .agents/skills/okf/okf-<nombre>/SKILL.md
 *   - Si el script se ejecuta desde el repo harness-okf (existe
 *     ../templates/skills/), copia ahí los skills de las plantillas
 *     (sobrescribe: así se actualizan).
 *   - Si no, y existen skills en el formato antiguo .harness/skills/okf-*,
 *     los migra a .agents/skills/okf/.
 *
 * Estrategia por agente (.claude siempre; .gemini solo si existe .gemini/):
 *   1. <agente>/skills no existe            → enlace <agente>/skills → .agents/skills
 *   2. <agente>/skills ya enlaza a .agents/skills → nada que hacer
 *   3. <agente>/skills existe               → enlace <agente>/skills/okf →
 *                                             .agents/skills/okf (sin tocar
 *                                             los skills ajenos)
 *
 * Enlaces según plataforma:
 *   - Windows: junction de directorio (NO requiere administrador ni Developer
 *     Mode). Si falla → copia de .agents/skills/okf.
 *   - macOS/Linux: symlink normal. Si falla → copia.
 *   - La copia lleva un marcador (.okf-copy) y se refresca en cada ejecución:
 *     re-ejecuta este script tras modificar un skill.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FORCE_COPY = process.argv.includes('--copy');
const COPY_MARKER = '.okf-copy';

// ROOT del proyecto: si el script vive en <proyecto>/.harness/scripts/ se
// deduce de su ruta; si no (ejecutado desde el repo harness-okf), es el cwd.
let ROOT = __dirname.replace(/[\\/]\.harness[\\/]scripts$/, '');
if (ROOT === __dirname) ROOT = process.cwd();

const TEMPLATES = path.join(__dirname, '..', 'templates', 'skills');
const LEGACY = path.join(ROOT, '.harness', 'skills');
const AGENTS_SKILLS = path.join(ROOT, '.agents', 'skills');
const OKF = path.join(AGENTS_SKILLS, 'okf');

const AGENTS = [
  { name: 'Claude Code', root: '.claude', always: true },
  { name: 'Gemini', root: '.gemini', always: false },
];

function log(msg) { console.log('  ' + msg); }

// ── helpers ──────────────────────────────────────────────────
function isLinkTo(linkPath, expectedTarget) {
  try {
    const st = fs.lstatSync(linkPath);
    if (!st.isSymbolicLink()) return false;
    const resolved = path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath));
    return path.resolve(resolved) === path.resolve(expectedTarget);
  } catch { return false; }
}

function exists(p) {
  try { fs.lstatSync(p); return true; } catch { return false; }
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, e.name);
    const d = path.join(destDir, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function link(srcDir, destDir) {
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(srcDir, destDir, type);
}

// Copia .agents/skills/okf → destDir marcándola como copia gestionada.
function copyOkf(destDir) {
  copyDir(OKF, destDir);
  fs.writeFileSync(path.join(destDir, COPY_MARKER), 'Copia gestionada por okf-link-skills.js\n');
}

// ── 0. fuente: .agents/skills/okf ────────────────────────────
console.log('\n════════════════════════════════════════════');
console.log('  OKF LINK SKILLS');
console.log('════════════════════════════════════════════');

if (fs.existsSync(TEMPLATES)) {
  for (const f of fs.readdirSync(TEMPLATES)) {
    if (!/^okf-.+\.md$/i.test(f)) continue;
    const dir = path.join(OKF, f.replace(/\.md$/i, ''));
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(TEMPLATES, f), path.join(dir, 'SKILL.md'));
  }
  log('📦 skills copiados desde templates/skills/ → .agents/skills/okf/');
} else if (!fs.existsSync(OKF) && fs.existsSync(LEGACY)) {
  for (const e of fs.readdirSync(LEGACY, { withFileTypes: true })) {
    if (e.isDirectory() && /^okf-/.test(e.name)) {
      copyDir(path.join(LEGACY, e.name), path.join(OKF, e.name));
    } else if (e.isFile() && /^okf-.+\.md$/i.test(e.name)) {
      const dir = path.join(OKF, e.name.replace(/\.md$/i, ''));
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(path.join(LEGACY, e.name), path.join(dir, 'SKILL.md'));
    }
  }
  log('🔧 migrados .harness/skills/okf-* → .agents/skills/okf/');
  log('   (puedes borrar .harness/skills/okf-* cuando lo verifiques)');
}

const skills = fs.existsSync(OKF)
  ? fs.readdirSync(OKF, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(OKF, e.name, 'SKILL.md')))
    .map((e) => e.name)
  : [];

if (skills.length === 0) {
  log('⚠️  No hay skills en .agents/skills/okf/ — instala primero el cerebro (prompts/01_init.md).');
  console.log('════════════════════════════════════════════\n');
  process.exit(1);
}
log(`Skills: ${skills.join(', ')}`);

// ── 1. agentes ───────────────────────────────────────────────
let usedCopy = false;
let failed = 0;
let published = 0;

for (const agent of AGENTS) {
  if (!agent.always && !fs.existsSync(path.join(ROOT, agent.root))) continue;
  const skillsDir = path.join(ROOT, agent.root, 'skills');
  console.log(`\n  ${agent.name} (${agent.root}/skills/)`);

  try {
    // Caso 2: ya enlazada entera a .agents/skills
    if (isLinkTo(skillsDir, AGENTS_SKILLS)) {
      log('✅ ya enlazada a .agents/skills');
      published++;
      continue;
    }

    // Caso 1: no existe → enlace de la carpeta entera
    if (!exists(skillsDir)) {
      fs.mkdirSync(path.dirname(skillsDir), { recursive: true });
      if (!FORCE_COPY) {
        try {
          link(AGENTS_SKILLS, skillsDir);
          log('✅ skills → .agents/skills (enlace)');
          published++;
          continue;
        } catch (_) { /* fallback copia */ }
      }
      copyOkf(path.join(skillsDir, 'okf'));
      usedCopy = true;
      log('✅ skills/okf: copia');
      published++;
      continue;
    }

    // Caso 3: existe → enlace solo de skills/okf
    const dest = path.join(skillsDir, 'okf');
    if (isLinkTo(dest, OKF)) { log('✅ skills/okf: ya enlazado'); published++; continue; }
    if (exists(dest)) {
      if (!fs.existsSync(path.join(dest, COPY_MARKER))) {
        log('ℹ️  skills/okf ya existe y no es de okf-link-skills (se conserva)');
        continue;
      }
      // Copia gestionada: se refresca (o se sustituye por enlace)
      fs.rmSync(dest, { recursive: true, force: true });
    }
    if (!FORCE_COPY) {
      try {
        link(OKF, dest);
        log('✅ skills/okf → .agents/skills/okf (enlace)');
        published++;
        continue;
      } catch (_) { /* fallback copia */ }
    }
    copyOkf(dest);
    usedCopy = true;
    log('✅ skills/okf: copia');
    published++;
  } catch (err) {
    log(`❌ falló (${err.message})`);
    failed++;
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
  ? `  ✅ [SKILLS OK] ${skills.length} skill(s) en .agents/skills/okf, publicados en ${published} agente(s)`
  : `  ❌ [SKILLS PARCIAL] ${failed} fallo(s) — revisa arriba`);
console.log('════════════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
