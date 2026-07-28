---
name: uml-export
description: Exporta (renderiza) a imagen los diagramas PlantUML (.puml) que se indiquen — ficheros sueltos o carpetas enteras. Úsala cuando el usuario pida generar/exportar/renderizar las imágenes (PNG, SVG…) de uno o varios diagramas .puml, o tras crear/actualizar diagramas con la skill `uml-diagram`. Autodetecta el motor de render disponible (plantuml CLI, Docker o el jar de la extensión) sin necesidad de tener Java/Graphviz instalados.
---

# Skill: Exportador de diagramas PlantUML (.puml → imagen)

Renderiza a imagen **los diagramas `.puml` que se indiquen**, dejando el resultado **junto al
`.puml` fuente** (misma carpeta y mismo nombre base). Es el paso complementario a la skill
`uml-diagram`: primero se generan/actualizan los `.puml`; luego esta skill los exporta a imagen.

Esta skill **no modifica** el contenido de los diagramas: solo los renderiza. Para crear o
corregir un `.puml`, usa la skill `uml-diagram`.

## Cuándo se activa

- El usuario pide **exportar / renderizar / generar las imágenes** de uno o varios `.puml`.
- Tras crear o actualizar diagramas (típicamente después de `uml-diagram`), para producir los
  `.png`/`.svg` que se enlazan en el README.

## Entrada

- **Rutas indicadas por el usuario**: uno o varios **ficheros `.puml`** y/o **carpetas** (en cuyo
  caso se exporta todo `.puml` que contengan, de forma recursiva).
- **Formato** de salida (opcional, por defecto `png`): `png`, `svg` o `pdf`.

Si el usuario no indica qué exportar, **pregunta** qué ficheros/carpetas y en qué formato.

## Mecanismo (OBLIGATORIO usar el script)

Usa siempre el script incluido, que **autodetecta el motor** de render y escribe la imagen junto
al fuente. No reimplementes el render con comandos ad hoc.

```bash
.claude/skills/uml-export/scripts/render-plantuml.sh [--format png|svg|pdf] \
    [--engine auto|plantuml|docker|jar] [--check-only] <fichero-o-carpeta> [más...]
```

Ejecuta el script **desde la raíz del repositorio** (necesario para el motor Docker, que mapea las
rutas dentro del contenedor).

### Orden de autodetección del motor (`--engine auto`)

Todos necesitan **Graphviz (`dot`)** para clases/estados/actividad; la imagen Docker ya lo incluye.

1. **`plantuml`** — CLI `plantuml` en el `PATH` (solo si además hay `dot`).
2. **`docker`** — `docker run --rm plantuml/plantuml` (autocontenido, trae Graphviz). Es el más
   fiable cuando no hay Java/Graphviz locales.
3. **`jar`** — `java -jar <plantuml.jar>` (solo si hay `dot`); el jar se toma de `$PLANTUML_JAR` o
   de la extensión PlantUML de VS Code/Cursor.

Se puede forzar con `--engine <motor>` o la variable `$PLANTUML_ENGINE`.

## Flujo de trabajo

1. **Determina el alcance**: los `.puml` a exportar (ficheros o carpetas) y el formato. Pregunta
   solo si falta.
2. **(Recomendado) Valida la sintaxis** primero con `--check-only`; si hay errores, repórtalos y
   **no** continúes con el render (los errores de sintaxis se corrigen con `uml-diagram`).
3. **Renderiza** ejecutando el script con las rutas indicadas.
4. **Verifica**: el script lista cada imagen generada con su tamaño y avisa si un PNG sale
   sospechosamente pequeño (posible imagen de error de PlantUML) o si falta. Revisa esos avisos.
5. **Devuelve** al usuario la lista de imágenes generadas (rutas) y el motor usado.

## Ejemplos de invocación

```bash
# Un diagrama a PNG
.claude/skills/uml-export/scripts/render-plantuml.sh \
    system_architecture/design_view/sequence_hu4_public-booking.puml

# Una carpeta entera (todos sus .puml) a PNG
.claude/skills/uml-export/scripts/render-plantuml.sh \
    system_architecture/design_view/classes_design/

# Varios destinos, a SVG
.claude/skills/uml-export/scripts/render-plantuml.sh --format svg \
    system_architecture/design_view system_architecture/deploy_view

# Solo comprobar sintaxis, sin generar imágenes
.claude/skills/uml-export/scripts/render-plantuml.sh --check-only \
    system_architecture/design_view/classes_design/
```

## Lista de verificación de calidad (antes de terminar)

- [ ] Se han exportado exactamente los `.puml` indicados (ni más, ni menos).
- [ ] Cada imagen se ha creado junto a su `.puml` con el mismo nombre base.
- [ ] Ningún PNG es una imagen de error (revisar avisos de tamaño del script).
- [ ] Formato de salida el solicitado (por defecto `png`).
- [ ] Si algún diagrama falló, se reporta con su causa probable (sintaxis) y no se oculta.

## Notas

- El contenido y las convenciones de los diagramas son responsabilidad de `uml-diagram` y de las
  rules del proyecto (`uml-rup.md`, `plantuml-syntax.md`); esta skill solo exporta.
- No traduce ni renombra los `.puml`; respeta la nomenclatura existente (regla `file-naming.md`).
- Los `.png`/`.svg` se versionan junto al `.puml` fuente, como el resto de diagramas del proyecto.
