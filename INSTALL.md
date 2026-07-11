# Instalación de un cerebro OKF

## Requisitos

- Un agente IA con acceso al filesystem del proyecto (Claude Code, Gemini CLI,
  Cursor, Windsurf, opencode…).
- Node.js (opcional pero recomendado — solo lo usa el validador `okf-check.js`).
- **No** requiere harness-kit. Si está instalado, conviven sin conflicto.

## Pasos

1. **Abre tu agente en la raíz del proyecto anfitrión** (el proyecto que recibirá
   el cerebro, no este repo).

2. **Pega el contenido de [`prompts/01_init.md`](prompts/01_init.md)** y añade al
   final la ruta donde tienes el harness-okf, por ejemplo:

   > El harness-okf está en `C:\Descargas\repos-dockers\harness-okf`

3. **FASE A-B:** el agente analiza el proyecto y te propone el diseño del cerebro
   (tipos, categorías, inventario de fuentes, reglas de dominio). **Revisa la
   propuesta** — es la decisión más importante de la instalación — y da tu OK
   (o corrige).

4. **FASE C-D:** el agente genera `.harness/llm-wiki/`, instala los skills,
   ejecuta el validador y te sugiere las primeras ingestas.

5. **Verifica tú mismo:**
   ```
   node .harness/scripts/okf-check.js
   ```
   Debe terminar en `[OKF OK]`.

## Uso diario

| Quiero… | Con skills instalados | Sin skills |
|---|---|---|
| Meter una fuente nueva | "ingiere `docs/informe.pdf` en el cerebro" | pegar `prompts/02_ingest.md` |
| Preguntar al cerebro | "según el cerebro, ¿…?" | pegar `prompts/03_query.md` |
| Revisión de salud | "pasa el lint al cerebro" | pegar `prompts/04_lint.md` |

## Notas

- **Obsidian:** puedes abrir `.harness/llm-wiki/` como vault — los links y el
  graph view funcionan tal cual.
- **Git:** el cerebro son ficheros markdown normales; committéalo con el proyecto
  para tener historial del conocimiento.
- **Convivencia con harness-kit:** harness-okf solo escribe en
  `.harness/llm-wiki/`, `.harness/skills/okf-*/` y `.harness/scripts/okf-*.js`.
  El resto de `.harness/` es territorio de harness-kit.
- **Skills en la carpeta del agente:** `node .harness/scripts/okf-link-skills.js`
  publica los skills en `.claude/skills/`, `.gemini/skills/` y `.agents/skills/`.
  En Windows usa **junctions** (no requieren administrador ni Developer Mode);
  en macOS/Linux, symlinks. Si el enlace falla, copia los ficheros y te avisa de
  que la copia no se sincroniza sola (re-ejecuta el script tras cambiar un skill).
  Con `--copy` fuerzas copia en vez de enlaces. Si `.claude/skills` ya es un
  enlace de harness-kit a `.harness/skills`, no hace nada: los okf-* ya son visibles.
- **Importar un cerebro previo (seed):** en FASE D el instalador ofrece copiar
  contenido desde un cerebro existente (ej. un vault personal). Se copia y adapta
  — nunca se enlaza fuera del proyecto: el cerebro resultante es autocontenido.
