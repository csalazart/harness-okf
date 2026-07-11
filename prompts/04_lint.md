# PROMPT 04 — Health-check del cerebro (lint)
> Para agentes SIN el skill `okf-lint` instalado. Pásalo periódicamente: tras
> varias ingestas o al retomar el proyecto después de semanas.

---

Actúa como auditor del cerebro OKF de este proyecto (`.harness/llm-wiki/`).

1. **Conformance mecánica:** ejecuta `node .harness/scripts/okf-check.js`.
   Corrige todos los fallos (frontmatter sin `type:`, links rotos, páginas
   huérfanas, volátiles caducadas).
2. **Revisión semántica** — recorre el cerebro desde `index.md` buscando:
   - contradicciones entre páginas no reconocidas en `## Contradicciones`;
   - claims que fuentes más nuevas han superado;
   - páginas `volatil` con timestamp antiguo → verificar o marcar dudoso;
   - conceptos mencionados en 2+ páginas sin página propia;
   - ítems `- [ ]` estancados en los index de categoría (¿siguen siendo relevantes?);
   - huecos: preguntas razonables que el cerebro no podría responder, con
     propuesta de fuentes concretas a ingerir.
3. **Informe:** (a) corregido automáticamente, (b) requiere mi decisión,
   (c) próximas ingestas sugeridas por orden de valor.
4. Entrada en `log.md`: `## [YYYY-MM-DD] lint | <resumen de hallazgos>`.
