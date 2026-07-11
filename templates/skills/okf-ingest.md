---
name: okf-ingest
description: Integrar una fuente nueva en el cerebro OKF del proyecto (.harness/llm-wiki/). Usar cuando el usuario deposite un documento, artículo, PDF o URL y pida procesarlo/ingerirlo en el cerebro.
---

# okf-ingest — Integrar una fuente en el cerebro

Opera SOLO dentro de `.harness/llm-wiki/`. Lee primero `SCHEMA.md` (convenciones
del proyecto) e `index.md` (god node) si no lo has hecho en esta sesión.

## Pasos

1. **Localizar la fuente.** Debe estar en `raw/` o referenciada en `raw/index.md`.
   Si el usuario da una URL o un fichero suelto, añádelo primero al inventario de
   `raw/index.md` con estado ⬜. NUNCA modifiques un fichero de `raw/`.

2. **Leer la fuente completa** y comentar con el usuario los puntos clave si está
   presente (si es una ingesta batch, continuar sin pausa).

3. **Crear la página `Fuente`** en `wiki/fuentes/` usando `_templates/_fuente.template.md`:
   resumen fiel, `resource:` al original, valoración de fiabilidad razonada,
   datos clave extraídos.

4. **Actualizar el wiki.** Recorre las categorías afectadas: crea o actualiza las
   páginas `Concepto`/`Entidad` que la fuente toca (puede ser 10-15 páginas).
   En cada página tocada: actualiza `timestamp`, añade la fuente a su sección
   `## Fuentes`. Si la fuente contradice conocimiento previo, NO lo sobrescribas
   en silencio: documenta ambas versiones en `## Contradicciones` de la página
   afectada y en la página `Fuente`.

5. **Mantener el grafo.** Toda página nueva queda enlazada desde el `index.md`
   de su categoría. Marca ✅ la fuente en `raw/index.md`. Actualiza el god node
   si cambió algo estructural (nueva categoría, página destacada).

6. **Registrar.** Añade a `log.md`:
   `## [YYYY-MM-DD] ingest | <título de la fuente>` con 1-3 líneas: qué páginas
   se crearon/actualizaron y contradicciones detectadas.

7. **Verificar.** Si existe `.harness/scripts/okf-check.js`, ejecuta
   `node .harness/scripts/okf-check.js` y corrige lo que falle.

## Reglas

- Datos que caducan (precios, APRs, fees, estados) → `tags: [volatil]` y fecha inline.
- Afirmación sin fuente trazable → marcar `(sin verificar)`.
- Nunca guardar credenciales, seeds ni claves.
