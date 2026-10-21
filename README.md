# harness-okf
> Instalador de **cerebros de conocimiento OKF** autocontenidos, por proyecto.
> Herramienta hermana de [harness-kit-install](https://github.com/csalazart/harness-kit-install) — mismo ecosistema (`.harness/`), responsabilidades separadas.

---

## Qué es

`harness-okf` instala en cualquier proyecto un **cerebro OKF**: una knowledge base
persistente en `.harness/llm-wiki/` que un agente LLM construye y mantiene de forma
incremental. En vez de re-derivar el conocimiento en cada consulta (RAG clásico),
el cerebro se compila una vez y se mantiene vivo: cada fuente nueva se integra en
las páginas existentes, las contradicciones se marcan, la síntesis se acumula.

Basado en:
- **Open Knowledge Format (OKF v0.1)** de Google Cloud — el formato: markdown +
  frontmatter YAML, `index.md`/`log.md` reservados, links = grafo. Sin plataforma,
  sin SDK, sin base de datos.
- **Patrón LLM-Wiki** de Karpathy ([llm-wiki.md](llm-wiki.md)) — el proceso:
  fuentes raw inmutables → wiki mantenido por el agente → schema de convenciones,
  con tres operaciones (ingest, query, lint).

Contrato completo: [OKF.md](OKF.md).

## Principios de diseño

1. **Cada proyecto es independiente.** Su cerebro es único, completo y
   autocontenido. No depende de vaults externos ni sabe que existen otros cerebros.
2. **Standalone pero compatible.** No requiere harness-kit; instala bajo
   `.harness/` para convivir con él. Si harness-kit está presente, jamás toca
   `context/`, `knowledge/`, `STATE.md` ni nada suyo. Dos herramientas, un ecosistema.
3. **Agnóstico al tipo de proyecto.** Funciona igual para un proyecto de código,
   uno de investigación documental (sin código) o uno mixto.
4. **Sin promesas falsas.** Todo mantenimiento pasa por skills explícitos
   (`okf-ingest`, `okf-query`, `okf-lint`) y un validador real (`okf-check.js`).

## Reparto con harness-kit

> **Kit completo (recomendado):** instala primero
> [harness-kit-install](https://github.com/csalazart/harness-kit-install)
> (flujo de trabajo v3) y después este harness-okf — su instalador detecta el
> `.harness/` existente y añade solo sus piezas. Cualquier orden funciona y
> cada herramienta es usable por sí sola.

| | harness-kit | harness-okf |
|---|---|---|
| Responsabilidad | Flujo de trabajo: tareas, estado de sesión, roles de agentes, reglas | Conocimiento: dominio, fuentes verificadas, conceptos, síntesis |
| Carpetas | `.harness/context/`, `workspaces/`, `rules/`, `STATE.md` | `.harness/llm-wiki/` |
| Memoria | Volátil + estable de sesión (dónde vamos) | Durable de dominio (qué sabemos) |

## Quickstart

1. Abre tu agente IA (Claude Code, Gemini, Cursor…) en la raíz del proyecto.
2. Pégale [prompts/01_init.md](prompts/01_init.md) indicando la ruta de este repo.
3. El agente descubre el proyecto (FASE A), te propone tipos, categorías y fuentes
   (FASE B — esperas tu OK), construye el cerebro (FASE C) y te sugiere las
   primeras ingestas (FASE D).
4. A partir de ahí: skills `okf-ingest` / `okf-query` / `okf-lint` (o los prompts
   02-04 si tu agente no soporta skills).

Detalles: [INSTALL.md](INSTALL.md).

## Estructura de este repo

```
harness-okf/
├── OKF.md            contrato OKF (leer primero)
├── INSTALL.md        guía de instalación
├── llm-wiki.md       idea-file original de Karpathy (referencia)
├── prompts/          01_init (instalador) · 02_ingest · 03_query · 04_lint
├── templates/
│   ├── SCHEMA.md.template     convenciones por proyecto
│   ├── brain/                 README, index (god node), log, raw-index, categoria-index
│   ├── pages/                 _concepto, _entidad, _fuente, _playbook, _sintesis
│   └── skills/                okf-ingest, okf-query, okf-lint
└── scripts/
    ├── okf-check.js        validador de conformance (Node, sin dependencias)
    └── okf-link-skills.js  instala los skills en .agents/skills/okf y los enlaza
                            en .claude/.gemini (junction en Windows sin admin,
                            symlink en mac/linux, fallback a copia)
```

## Qué genera en el proyecto anfitrión

```
<proyecto>/
├── AGENTS.md               ← sección "## Cerebro OKF" añadida (o creado con ella)
├── CLAUDE.md               ← import @AGENTS.md verificado (o creado mínimo)
├── .agents/skills/okf/okf-{ingest,query,lint}/SKILL.md   ← skills (fuente)
├── .claude/skills          → enlace a .agents/skills (o skills/okf → .agents/skills/okf
│                             si .claude/skills ya existía)
└── .harness/
    ├── llm-wiki/           ← EL CEREBRO
    │   ├── README.md · SCHEMA.md · index.md · log.md
    │   ├── raw/index.md    inventario de fuentes ⬜/✅
    │   ├── wiki/<categoria>/index.md
    │   └── _templates/
    └── scripts/  okf-check.js · okf-link-skills.js
```
