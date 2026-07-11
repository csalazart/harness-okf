---
name: okf-lint
description: Health-check del cerebro OKF del proyecto (.harness/llm-wiki/) — contradicciones, páginas huérfanas, datos caducados, huecos. Usar periódicamente, tras varias ingestas, o al retomar el proyecto tras tiempo.
---

# okf-lint — Health-check del cerebro

## Pasos

1. **Conformance mecánica.** Si existe, ejecuta `node .harness/scripts/okf-check.js`
   y anota los fallos (frontmatter sin `type:`, links rotos, huérfanas, volátiles
   caducadas). Corrígelos.

2. **Revisión semántica.** Recorre el cerebro desde `index.md` buscando:
   - **Contradicciones** entre páginas que ninguna reconoce en `## Contradicciones`.
   - **Claims obsoletos**: afirmaciones que fuentes más nuevas superan.
   - **Páginas `volatil`** con `timestamp` antiguo → verificar o marcar como dudoso.
   - **Conceptos fantasma**: mencionados en varias páginas pero sin página propia.
   - **Checklist estancado**: ítems `- [ ]` de los index de categoría que llevan
     mucho pendientes — ¿siguen siendo relevantes?
   - **Huecos**: preguntas que el cerebro no podría responder y debería; propone
     fuentes concretas a buscar/ingerir.

3. **Informe.** Presenta al usuario: problemas corregidos, problemas que requieren
   su decisión, y una lista priorizada de próximas ingestas sugeridas.

4. **Registrar.** Entrada en `log.md`:
   `## [YYYY-MM-DD] lint | <resumen>` con los hallazgos principales.
