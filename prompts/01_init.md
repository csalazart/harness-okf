# PROMPT 01 — Instalar un cerebro OKF en este proyecto
> Copia y pega este prompt completo a tu agente IA (Claude Code, Gemini, Cursor…)
> abierto en la RAÍZ del proyecto anfitrión. Indícale también dónde está el
> harness-okf (ej. `C:\Descargas\repos-dockers\harness-okf`).

---

Actúa como **OKF Engineer**. Vas a instalar un cerebro de conocimiento OKF
autocontenido en este proyecto, usando las plantillas del harness-okf.
Lee primero `<harness-okf>/OKF.md` (el contrato) entero.

Trabaja por fases y **espera mi OK entre FASE B y FASE C**.

---

## FASE A — Descubrimiento (solo lectura)

1. **Conoce el proyecto.** Lee README, CLAUDE.md/AGENTS.md/GEMINI.md si existen,
   docs/, y ojea la estructura de carpetas. No asumas nada: si el propósito del
   proyecto no queda claro, pregúntame.
2. **Clasifica el proyecto:** ¿es de código, de investigación/documental (sin
   código, solo documentos), o mixto? El cerebro funciona igual en los tres casos.
3. **Detecta el entorno:**
   - ¿Existe ya `.harness/`? (= harness-kit instalado). Si existe, tu instalación
     SOLO añadirá `llm-wiki/` y `scripts/okf-*.js` (los skills van a `.agents/`) — está
     PROHIBIDO tocar `context/`, `knowledge/`, `STATE.md`, `workspaces/`, `logs/`
     o cualquier otra cosa del harness-kit.
   - ¿Existen `.agents/skills/`, `.claude/skills/`, `.gemini/`? (para instalar y
     enlazar los skills).
   - ¿Hay Node disponible? (`node --version`) — necesario solo para `okf-check.js`.
4. **Inventaría fuentes candidatas:** documentos ya presentes en el proyecto
   (PDFs, MDs de investigación, planes, specs, esquemas) que deberían entrar en
   el inventario de `raw/index.md`. No los muevas: se referencian in situ.

## FASE B — Propuesta (espera mi OK)

Presenta y espera mi confirmación:

1. **Resumen del proyecto** en 3-5 líneas (qué es, qué dominio cubre).
2. **Vocabulario de `type:`** — los 6 tipos base (`Concepto`, `Entidad`, `Fuente`,
   `Playbook`, `Sintesis`, `Overview`) más 1-3 tipos propios del dominio si
   aportan (ej. `SmartContract`, `NormaLegal`). No inventes tipos porque sí.
3. **Categorías de `wiki/`** — 3-6 carpetas derivadas del dominio real del
   proyecto (ej. para un analizador DeFi: `conceptos`, `conectores`, `protocolos`,
   `estrategias`; para una investigación legal: `protocolo`, `legal`, `fiscalidad`,
   `operativa`). Siempre incluye `fuentes`.
4. **Inventario inicial de fuentes** para `raw/index.md` (lo detectado en A.4 +
   fuentes externas que convendría buscar).
5. **Reglas de dominio** para el SCHEMA (ej. "todo dato de mercado es `volatil`",
   "toda afirmación legal cita norma oficial").
6. **3-5 primeras páginas candidatas** con su categoría y tipo.

## FASE C — Construcción (solo tras mi OK)

Genera desde `<harness-okf>/templates/`, rellenando TODOS los placeholders
`{{...}}` con los valores confirmados en FASE B (no dejes ninguno sin rellenar):

1. `.harness/llm-wiki/README.md` ← `templates/brain/README.md.template`
2. `.harness/llm-wiki/SCHEMA.md` ← `templates/SCHEMA.md.template`
   (tabla de tipos, categorías y reglas de dominio de FASE B)
3. `.harness/llm-wiki/index.md` ← `templates/brain/index.md.template` (god node).
   **Regla estricta: cada link que escribas debe apuntar a un fichero que TÚ
   crees en esta misma fase.** Nada de links a ficheros futuros.
4. `.harness/llm-wiki/log.md` ← `templates/brain/log.md.template` (primera
   entrada `setup` con fecha real).
5. `.harness/llm-wiki/raw/index.md` ← `templates/brain/raw-index.md.template`
   (inventario de FASE B.4, todo en ⬜).
6. `.harness/llm-wiki/wiki/<categoria>/index.md` por cada categoría confirmada
   ← `templates/brain/categoria-index.md.template` (con el checklist de páginas
   candidatas de FASE B.6). Incluye `wiki/fuentes/index.md`.
7. `.harness/llm-wiki/_templates/` ← copia los 5 de `templates/pages/`.
8. **Skills:** copia cada skill de `templates/skills/` al formato carpeta dentro
   de la carpeta estándar `.agents/skills/okf/`:
   `.agents/skills/okf/okf-ingest/SKILL.md`, `.agents/skills/okf/okf-query/SKILL.md`,
   `.agents/skills/okf/okf-lint/SKILL.md`.
9. **Scripts:** copia `<harness-okf>/scripts/okf-check.js` y
   `<harness-okf>/scripts/okf-link-skills.js` a `.harness/scripts/`.
   Ejecuta `node .harness/scripts/okf-link-skills.js` — publica los skills en
   las carpetas de los agentes (`.claude/` siempre, `.gemini/` si existe):
   - si `<agente>/skills/` no existe → enlace `<agente>/skills` → `.agents/skills`;
   - si ya existe → enlace solo `<agente>/skills/okf` → `.agents/skills/okf`,
     sin tocar los skills ajenos.
   Usa junctions en Windows (sin permisos de admin) o symlinks en macOS/Linux,
   con fallback a copia. Debe terminar en `[SKILLS OK]`.
10. **Registro en el agente** — es lo que hace que cualquier agente SEPA que el
    cerebro existe. Regla simple: **el contenido vive en AGENTS.md; CLAUDE.md
    solo lo importa**. Vale para los tres escenarios: solo harness-okf, solo
    harness-kit previo, o ambos en cualquier orden.

    La sección a registrar es "## Cerebro OKF" y dice: dónde está el cerebro
    (`.harness/llm-wiki/`), que el punto de entrada es `index.md` (god node),
    que las operaciones son los skills `okf-ingest` / `okf-query` / `okf-lint`,
    y (solo si hay harness-kit) la frontera: `context/` = dónde vamos (sesión);
    `llm-wiki/` = qué sabemos (dominio).

    - **AGENTS.md existe** (típico con harness-kit): AÑADE la sección al final.
      Si tiene protocolo de inicio/handshake, añade también la línea: *"Si la
      tarea requiere conocimiento del dominio, lee además
      `.harness/llm-wiki/index.md`"*. No toques nada más del fichero.
    - **AGENTS.md no existe**: créalo conteniendo solo la sección "## Cerebro OKF".
    - **CLAUDE.md existe**: verifica que importa AGENTS.md (línea `@AGENTS.md`);
      si no la tiene, añádela. No dupliques la sección dentro de CLAUDE.md.
    - **CLAUDE.md no existe**: créalo mínimo, con el import `@AGENTS.md`.
11. **Verificación:** ejecuta `node .harness/scripts/okf-check.js`. Debe terminar
    en `[OKF OK]`. Si falla, corrige y repite hasta que pase.

## FASE D — Cierre

1. Muéstrame el árbol de ficheros generado.
2. Muéstrame la salida de `okf-check.js`.
3. Sugiere las 2-3 primeras ingestas (de `raw/index.md`) por orden de valor.
4. **Seed opcional:** pregúntame si quiero importar contenido desde un cerebro
   ya existente. Fuentes de seed posibles:
   - un brain de un vault personal externo;
   - el bundle antiguo `.harness/knowledge/` de harness-kit, si existe en este
     proyecto (sus conceptos con `resource:` siguen siendo válidos; impórtalos
     a la categoría que corresponda SIN borrar ni modificar el original).
   Si digo que sí: COPIA las páginas al cerebro nuevo adaptando sus links
   (nunca enlaces al vault externo — este cerebro es autocontenido), márcalas
   con su `timestamp` original y registra la importación en `log.md`.
5. Si el proyecto usa git, ofrece hacer commit de lo generado.
