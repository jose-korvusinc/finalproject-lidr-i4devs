---
description: Convención de nomenclatura de ficheros del proyecto. Todos los nombres de archivos y carpetas que se generen deben estar en inglés. Aplícala siempre que crees, renombres o muevas cualquier fichero.
globs:
alwaysApply: true
---

# Regla: Nomenclatura de ficheros en inglés

Esta regla define **cómo nombrar** cualquier fichero o carpeta que se genere en el proyecto.
Aplica a **todos** los tipos de archivo (código, documentación, diagramas `.puml`, activos,
configuración, etc.), salvo los ficheros estándar cuyo nombre está fijado por herramientas
externas (ver excepciones).

## 1. Principio rector

- **Todos los nombres de ficheros y carpetas se escriben en inglés.**
- Esta regla afecta **únicamente al nombre** del fichero/carpeta, **no a su contenido**. El
  contenido sigue las convenciones de su propia regla: por ejemplo, las etiquetas de los
  diagramas UML van en **español** según `uml-rup.md` y `plantuml-syntax.md`. Un `.puml`
  puede llamarse en inglés y tener su `title` y etiquetas en español.

## 2. Convenciones de formato

- Usa **`kebab-case`** (minúsculas con guiones) por defecto para documentación, diagramas y
  activos: `use-cases-overview.puml`, `data-model.md`.
- Respeta la convención propia de cada ecosistema cuando exista:
  - Componentes Angular: `kebab-case` (`booking-widget.component.ts`).
  - Clases/Módulos NestJS: `kebab-case` con sufijo (`reservations.service.ts`,
    `reservations.module.ts`).
  - Constantes o ficheros que una herramienta exija en otro formato: el que exija la
    herramienta.
- Sin espacios, tildes ni caracteres especiales; usa solo `[a-z0-9-_.]`.
- Nombres **descriptivos y en inglés**, coherentes con el dominio: traduce el concepto, no
  lo transliteres (p. ej. `selected-actors.puml`, no `actores_seleccionados.puml`).

## 3. Nomenclatura por tipo (alineada con las reglas existentes)

- Diagramas UML (ver `plantuml-syntax.md` y la skill `uml-diagram`):
  `<type>_<topic>.puml` en inglés, p. ej. `classes_reservation.puml`,
  `sequence_book-appointment.puml`, `actors_selected-user-stories.puml`.
- Documentación de secciones: mantiene el patrón numerado existente en inglés, p. ej.
  `02-user-stories.md`.

## 4. Excepciones (nombres fijados por convención externa)

No se traducen los ficheros cuyo nombre es un estándar establecido. Por ejemplo:
`README.md`, `LICENSE`, `Dockerfile`, `package.json`, `tsconfig.json`, `.gitignore`,
`CHANGELOG.md`, y similares.

## 5. Coherencia y trazabilidad

- Si renombras un fichero, actualiza todas las referencias (imports, enlaces en Markdown,
  rutas en documentación) para no romper la trazabilidad.
- Ante un fichero ya existente con nombre en español, **propón** su renombrado a inglés
  antes de hacerlo, e incluye la actualización de referencias.
