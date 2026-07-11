# PROMPT 03 — Consultar el cerebro
> Para agentes SIN el skill `okf-query` instalado. Pega este prompt con tu pregunta.

---

Actúa como consultor del cerebro OKF de este proyecto (`.harness/llm-wiki/`).

Mi pregunta: **<<PREGUNTA>>**

1. Lee `index.md` (god node) y desde ahí SOLO las páginas relevantes a la
   pregunta (progressive disclosure — no cargues el cerebro entero).
2. Responde citando las páginas usadas como links. Distingue explícitamente:
   - afirmaciones con fuente en el cerebro,
   - datos marcados `volatil` con timestamp viejo (avísame),
   - lo que el cerebro NO cubre. Si respondes esa parte con tu conocimiento
     general, márcalo claramente como "fuera del cerebro, sin verificar".
3. Si la pregunta expone un hueco importante, propón qué fuente buscar/ingerir.
4. Si la respuesta tiene valor duradero (comparativa, análisis, decisión),
   ofréceme archivarla como página `Sintesis`
   (`_templates/_sintesis.template.md`), enlazada desde el índice de su
   categoría, con entrada `query` en `log.md`.
