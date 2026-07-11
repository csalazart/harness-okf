# PROMPT 02 — Ingerir una fuente en el cerebro
> Para agentes SIN el skill `okf-ingest` instalado (si el skill existe, basta con
> pedir "ingiere <fuente>"). Pega este prompt e indica la fuente a procesar.

---

Actúa como mantenedor del cerebro OKF de este proyecto (`.harness/llm-wiki/`).
Lee `SCHEMA.md` e `index.md` del cerebro antes de empezar.

Quiero ingerir esta fuente: **<<RUTA O URL DE LA FUENTE>>**

Sigue el workflow de ingesta:

1. Añade la fuente al inventario `raw/index.md` (estado ⬜) si no está. No
   modifiques nunca ficheros de `raw/`.
2. Léela completa y coméntame los 3-5 puntos clave antes de escribir nada.
3. Crea la página `Fuente` en `wiki/fuentes/` (plantilla
   `_templates/_fuente.template.md`): resumen fiel, `resource:`, fiabilidad
   razonada, datos clave.
4. Actualiza todas las páginas `Concepto`/`Entidad` afectadas (crea las que
   falten). Contradicciones con conocimiento previo → sección
   `## Contradicciones`, nunca sobrescribir en silencio. Datos que caducan →
   `tags: [volatil]` + fecha inline.
5. Enlaza toda página nueva desde el `index.md` de su categoría. Marca ✅ en
   `raw/index.md`. Actualiza el god node si cambió algo estructural.
6. Entrada en `log.md`: `## [YYYY-MM-DD] ingest | <título>`.
7. Ejecuta `node .harness/scripts/okf-check.js` y corrige hasta `[OKF OK]`.
8. Resume: páginas creadas, páginas actualizadas, contradicciones detectadas.
