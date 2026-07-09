### 2. Historias de Usuario

[Volver al índice de prompts](../prompts.md)

**Prompt 1: Completar readme con las historias de usuario (Cursor Auto)**

Completar `sections_prompts/02-user-stories.md` basandote en la información creada en el fichero `bussiness_docs/prd.md` en la sección "3. Historias de Usuario (User Stories) y Criterios de Aceptación."

**Prompt 2: Actualizar la información de las historias de usuario y priorizar (Cursor Auto)**

Modifica `sections_prompts/02-user-stories.md` para completar la información de las historias de usuario:
1. Comprueba que cada historia de usuario cumple los criterios INVEST y haz los cambios que consideres para que todas los cumplan.
2. Establece claramente los criterios de aceptación que denen cumplirse para considerar cada historia de usuario como "terminada". Usar formato BDD
3. Estima estos cuatro elementos de cada historia de usuario (crea una tabla en MD con esta información):
   3.1. Impacto en el usuario y valor del negocio.
   3.2. Urgencia basada en tendencias del mercado y feedback de usuarios.
   3.3. Complejidad y esfuerzo estimado de implementación.
   3.4. Riesgos y dependencias entre tareas.
   3.5. Tiempo de desarrollo estimado.
4. Establece una prioridad de cada historia de usuario con estas etiquetas: Baja, Media, Alta, Critica

**Prompt 3: Crear dos rules para la sintaxis de UML y de plantuml (Claude Opus 4.8)**

Eres un experto en crear rules para claude. Necesito crear dos rules:
1. Sintáxis de diagramas de UML que hay que crear para la metodología RUP
2. Sintaxis de plantuml para crear los diagramas UML con su sintaxis
Guardar las dos rules en la carpeta @.claude/rules

**Prompt 4: Metaprompt para crear una skill (Claude Opus 4.8)**

Crea un prompt para crear una skill que genere cualquier diagrama en UML usando las rules @.claude/rules/uml-rup.md y @.claude/rules/plantuml-syntax.md

TRABAJO MANUAL: Revisar y ejecutar el prompt generado para crear la skill

**Prompt 5: Metaprompt para crear un subagente que use la skill anterior (Claude Opus 4.8)**

Crea un prompt para crear un subagente que use la skill @.claude/skills/uml-diagram/SKILL.md

TRABAJO MANUAL: Revisar y wjecutar el prompt generado para crear el subagente

**Prompt 6: Generar diagrama de actores con las 4 historias de usuario seleccionadas para el proyecto (Claude Opus 4.8)**

Haz un diagrama de casos de uso UML de las historias de usuario seleccionadas en el punto 2.3 del fichero `sections_readme/02-user-stories.md`

**Prompt 7: Generar diagrama de contexto (Claude Opus 4.8)**

Añadir una nueva sección "2.4 Modelo de contexto" en el fichero @sections_readme/02-user-stories.md donde se añade:
  1. Una pequeña descripción de lo que es un modelo de contexto en RUP (diagrama de estados donde las transiciones son las historias de usuario) y que se va a diagramar SOLO para las 4
  historias de usuario seleccionadas en el punto 2.3. Este diagrama sirve para ver como colaboran los casos de uso entre si.
  2. Crear el diagrama UML de contexto usando el agente `uml-diagrams-maker.md` semejante al de la imagen adjunta de ejemplo
  3. Guarda el diagrama UML en formato .puml en `system_architecture/user_stories_view`

**Prompt 8: Crear diagrama de estado por cada historia de usuario (Claude Opus 4.8)**

Crear un diagrama de estado UML especifico para cada caso de uso HU1-HU4 donde las transiciones serán mensajes que se mandan entre los actores y el sistema y los nodos son los estados que aparecen en el
diagrama de contexto `system_architecture/user_stories_view/context-model_selected-user-stories.puml`. Guardar estos cuatro ficheros .puml en la carpeta `system_architecture/user_stories_view`

**Prompt 9: Crear vista de interfaz para cada historia de usuario (Claude Opus 4.8)**

Dibujar unas vistas de interfaz para estos 4 casos de uso HU1-HU4 para adjuntarlas como documentación en la fase de Iniciación de RUP con draw.io

**Prompt 10: Crear vistas de interfaz especificas siguiendo el diagrama de estados de cada historia de usuario (Claude Opus 4.8)**

Genera con draw.io un conjunto de vistas para cada historia de usuario HU1-HU4 para mostrar como se veran las pantalla de cada estado que aparece en el diagrama de estados especifico de historia de usuario.
Los diagramas de estados de cada historia de usuario son: @system_architecture/user_stories_view/state-diagram_hu1.png , @system_architecture/user_stories_view/state-diagram_hu2.png,
  @system_architecture/user_stories_view/state-diagram_hu3.png y @system_architecture/user_stories_view/state-diagram_hu4.png
Almacena estas vistas en una carpeta por historia de usuario en @system_architecture/user_stories_view
