---
name: okf-query
description: Responder preguntas usando el cerebro OKF del proyecto (.harness/llm-wiki/) con citas, y archivar las respuestas valiosas como páginas Sintesis. Usar cuando el usuario pregunte algo sobre el dominio/conocimiento del proyecto.
---

# okf-query — Consultar el cerebro

## Pasos

1. **Index-first.** Lee `.harness/llm-wiki/index.md` (god node). NO cargues todo
   el cerebro: identifica desde el índice las categorías y páginas relevantes y
   lee solo esas (progressive disclosure). Sigue links si hace falta profundizar.

2. **Sintetiza citando.** Responde basándote en las páginas leídas, citándolas
   como links (`[dlmm](wiki/conceptos/dlmm.md)`). Distingue:
   - lo que el cerebro afirma con fuente,
   - lo marcado `(sin verificar)` o `volatil` con timestamp viejo (dilo),
   - lo que el cerebro NO cubre (dilo explícitamente — no rellenes con
     conocimiento propio sin avisar de que no está en el cerebro).

3. **¿Hueco detectado?** Si la pregunta expone un hueco importante, propón al
   usuario buscar/ingerir una fuente que lo cubra.

4. **Archivar si vale.** Si la respuesta tiene valor duradero (comparativa,
   análisis, decisión razonada), ofrece archivarla como página `Sintesis`
   (`_templates/_sintesis.template.md`) en la categoría que corresponda,
   enlazada desde su `index.md`, con entrada en `log.md`:
   `## [YYYY-MM-DD] query | <pregunta>`.
   Las consultas triviales no se archivan ni se loguean.
