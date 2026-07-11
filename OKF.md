# Open Knowledge Format (OKF) — Contrato del harness-okf
> Contrato de conocimiento del **proyecto anfitrión** donde se instala el cerebro.
> Versión: 0.2 (basado en OKF v0.1 de Google Cloud + patrón LLM-Wiki de Karpathy) | Actualizado: 2026-07-11

---

## 1. Qué es y por qué existe

**OKF es un formato de fichero, no una plataforma.** Representa el conocimiento
de un proyecto como una carpeta de ficheros Markdown con cabecera YAML, enlazados
entre sí con links Markdown normales. Sin base de datos, sin runtime, sin SDK.
"Just files, just markdown, just YAML."

`harness-okf` instala en cada proyecto un **cerebro OKF autocontenido**:

> **El cerebro describe el conocimiento del PROYECTO ANFITRIÓN — su dominio, sus
> fuentes, sus conceptos, sus procedimientos. Cada proyecto es independiente:
> su cerebro es único, completo y no depende de ningún vault externo.**

A diferencia del RAG clásico (releer y re-derivar en cada consulta), el cerebro
se **compila una vez y se mantiene vivo**: cada fuente nueva se integra en las
páginas existentes, las contradicciones se marcan, la síntesis se acumula.

## 2. Dónde vive (dentro del proyecto anfitrión)

```
<proyecto-anfitrión>/
└── .harness/
    └── llm-wiki/            ← EL CEREBRO (bundle OKF autocontenido)
        ├── README.md            el contrato en una hoja (instalado)
        ├── SCHEMA.md            convenciones adaptadas a ESTE proyecto
        ├── index.md             god node / punto de entrada único
        ├── log.md               histórico cronológico (reservado)
        ├── raw/                 FUENTES INMUTABLES — el agente lee, nunca modifica
        │   └── index.md         inventario de fuentes con estado ⬜/✅
        ├── wiki/                páginas del agente, por categoría
        │   └── <categoria>/index.md
        └── _templates/          plantillas de página
```

Se usa `.harness/` como carpeta contenedora para convivir con `harness-kit`
(herramienta hermana del mismo ecosistema), pero **harness-okf no lo requiere**:
si `.harness/` no existe, el instalador la crea. Si existe, solo añade `llm-wiki/`
y sus skills — nunca toca `context/`, `knowledge/`, `STATE.md` ni nada del harness.

### Las tres capas (patrón LLM-Wiki)

| Capa | Qué es | Quién la escribe |
|---|---|---|
| `raw/` | Fuentes originales inmutables (docs, PDFs, artículos, exports). Fuente de verdad. | Humano (curación) |
| `wiki/` | Páginas OKF generadas y mantenidas por el agente | Agente LLM |
| `SCHEMA.md` | Convenciones y workflows de ESTE cerebro | Humano + agente, co-evoluciona |

## 3. El contrato (cabe en una hoja)

Un cerebro es OKF-conformante si cumple estas reglas. Nada más.

### 3.1 Un concepto = un fichero Markdown

La **ruta del fichero es la identidad del concepto**. `wiki/conectores/jupiter.md`
*es* el concepto "Conector Jupiter". No hay IDs sintéticos. No renombrar sin
actualizar todos los links.

### 3.2 Cabecera YAML (frontmatter)

```yaml
---
type: Entidad                   # ← ÚNICO campo OBLIGATORIO
title: Conector Jupiter         # nombre legible
description: Obtiene precios y rutas de swap de la API de Jupiter.
resource: src/connectors/jupiter.ts   # ruta/URL al recurso REAL (extensión harness)
tags: [solana, data-source]
timestamp: 2026-07-11T14:30:00Z # ISO-8601, última modificación
---
```

| Campo | Obligatorio | Significado |
|---|---|---|
| `type` | **Sí** | Categoría del concepto. Vocabulario definido por proyecto (ver §4). |
| `title` | Recomendado | Nombre legible por humanos. |
| `description` | Recomendado | Resumen de una línea. |
| `resource` | Recomendado* | **Extensión harness:** ruta relativa al recurso real (código, doc en `raw/`) o URL. Ancla el concepto a la realidad. |
| `tags` | Opcional | Etiquetas. Tag especial `volatil`: marca datos que caducan (ver §6). |
| `timestamp` | Recomendado | Última modificación (ISO-8601). |

> *`resource` es una extensión propia sobre OKF v0.1. Un consumidor OKF genérico
> la ignora sin romperse. Producers pueden añadir cualquier otro campo.

### 3.3 Cuerpo Markdown libre

Debajo del frontmatter, Markdown sin estructura prescrita: esquemas, tablas,
SQL, diagramas, runbooks. Las plantillas de `_templates/` son sugerencias, no ley.

### 3.4 Enlaces = grafo de conocimiento

Los conceptos se enlazan con **links Markdown normales** a rutas relativas:

```markdown
Depende del [esquema de la BD](../arquitectura/esquema-bd.md).
Ver la fuente [informe-2026](../fuentes/informe-2026.md).
```

El conjunto de links **es** el grafo. Ninguna página debe quedar huérfana:
toda página se enlaza al menos desde el `index.md` de su categoría.

### 3.5 Ficheros reservados

| Nombre | Rol |
|---|---|
| `index.md` | Resumen navegable de su carpeta (progressive disclosure). El `index.md` raíz es el **god node**: lo único que un agente carga *siempre* al inicio. |
| `log.md` | Histórico cronológico append-only. Formato de entrada: `## [YYYY-MM-DD] <op> \| <título>` con op ∈ {setup, ingest, query, lint}. |

## 4. Vocabulario de `type` — se deriva del proyecto anfitrión

OKF es *minimally opinionated*: no impone vocabulario. El instalador
(`prompts/01_init.md`, FASE B) lo propone según el proyecto y el usuario lo confirma.

Tipos base que harness-okf trae siempre (del patrón LLM-Wiki):

| `type` | Qué representa |
|---|---|
| `Concepto` | Idea o tema del dominio (ej. CLMM, Series LLC, elegibilidad de airdrop) |
| `Entidad` | Cosa concreta con identidad (API, contrato, protocolo, tabla, chain) |
| `Fuente` | Resumen de un documento de `raw/`, siempre con `resource:` al original y valoración de fiabilidad |
| `Playbook` | Procedimiento operativo paso a paso |
| `Sintesis` | Respuesta valiosa a una consulta, archivada como página |
| `Overview` / `Schema` / `Log` | Navegación y configuración |

El proyecto añade los suyos: un proyecto Solidity puede definir `SmartContract`
y `SecurityInvariant`; uno de investigación legal, `NormaLegal` y `Escenario`.

## 5. Operaciones (skills)

El cerebro se mantiene con tres operaciones, instaladas como skills en
`.harness/skills/`:

| Skill | Qué hace |
|---|---|
| `okf-ingest` | El humano deposita una fuente en `raw/` → el agente crea la página `Fuente`, actualiza los conceptos afectados (una fuente puede tocar 10-15 páginas), marca contradicciones, actualiza índices y log. |
| `okf-query` | Index-first retrieval: leer god node → páginas relevantes → sintetizar con citas. Las respuestas valiosas se archivan como `Sintesis`. |
| `okf-lint` | Health-check: contradicciones, páginas huérfanas, timestamps caducados en páginas `volatil`, conceptos mencionados sin página, huecos a investigar. |

## 6. Freshness — cómo se evita que el cerebro mienta

Un cerebro desactualizado es peor que ninguno: miente con apariencia de autoridad.
Mecanismos (honestos — no se promete ningún automatismo que no exista):

1. **Toda escritura pasa por un skill** (`okf-ingest`, `okf-lint`), y cada skill
   termina actualizando `timestamp` de las páginas tocadas + entrada en `log.md`.
2. **Datos volátiles llevan `tags: [volatil]`** (APRs, precios, fees, estado de
   protocolos). Una cifra sin fecha se considera inválida.
3. **`okf-check.js`** (validador Node sin dependencias) verifica la conformance
   (§8) y avisa cuando una página `volatil` supera la caducidad configurada.
4. **Lint periódico**: el skill `okf-lint` es la revisión de fondo; se recomienda
   pasarlo tras cada N ingests o al retomar el proyecto tras semanas.

## 7. Independencia del cerebro

Cada cerebro es **autocontenido por diseño**: no enlaza a vaults externos ni a
cerebros de otros proyectos, y no necesita saber que existen. Todo el conocimiento
que el proyecto necesita vive dentro de su `llm-wiki/` (duplicar un concepto que
también existe en otro proyecto es correcto y esperado — la independencia vale más
que la deduplicación).

Si el usuario mantiene además un vault global personal (ej. Obsidian), es su
decisión y queda fuera de este contrato; el instalador ofrece **importar un seed**
desde un cerebro existente al instalar (FASE D), copiando —no enlazando— el contenido.

## 8. Conformance checklist

- [ ] Cada `.md` del cerebro tiene frontmatter con `type:`.
- [ ] Todos los links Markdown relativos resuelven a ficheros existentes.
- [ ] Ninguna página huérfana: todas enlazadas desde algún `index.md`.
- [ ] Existen `index.md` (god node) y `log.md` en la raíz de `llm-wiki/`.
- [ ] `resource:` (cuando aplica) apunta a un recurso real.
- [ ] Las páginas `volatil` tienen `timestamp` vigente.
- [ ] El cerebro describe el **anfitrión**, no el harness-okf.
- [ ] Nunca contiene claves privadas, seeds, tokens ni credenciales.

Verificable con: `node .harness/scripts/okf-check.js`

---

> Plantillas: `templates/`. Instalación: `prompts/01_init.md`. Patrón original: `llm-wiki.md` (Karpathy) y el [artículo OKF de Google Cloud](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing).
