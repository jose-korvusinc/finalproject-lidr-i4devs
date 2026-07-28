## 4. Sistema agéntico

[Volver al índice de prompts](../prompts.md)

**Prompt 1: Metaprompt para crear un prompt que genere el subagente, skills y reglas de frontend para Angular 22 (Claude Opus 4.8)**
Crea un prompt que genere la regla o reglas en .claude/rules como experto programador frontend en Angular 22 siguiendo las buenas prácticas.
Tambien que cree la skill necesaria en .claude/skills para seguir esas reglas y un subagente en .claude/agents que use esa skill para la programación del proyecto SOLO para frontend.
Indicar que debe actualizar el fichero AGENTS.md cuando genere esos artefactos nuevos.
Indicar que el código del frontend esta en @code/frontend.
Indicar que en @code/frontend aparece una carpeta .claude y un fichero AGENTS.md que hay que eliminarlos y usar su contenido para crear el subagente, skill y rules.
ENTREGA: Guarda el prompt generado en la carpeta @sections_prompts/generated_prompts y hacer referencia en este apartado.

> **Prompt generado:** [`generated_prompts/angular-22-frontend-agent-generation-prompt.md`](generated_prompts/angular-22-frontend-agent-generation-prompt.md)

**Prompt 2: Metaprompt para crear un prompt que genere el subagente, skills y reglas de backend de NestJS 11.1 (Claude Opus 4.8)**
Crea un prompt que genere la regla o reglas en .claude/rules como experto programador backend en NestJS 11.1 siguiendo las buenas prácticas.
Tambien que cree la skill necesaria en .claude/skills para seguir esas reglas y un subagente en .claude/agents que use esa skill para la programación del proyecto SOLO para backend.
Indicar que debe actualizar el fichero AGENTS.md cuando genere esos artefactos nuevos.
Indicar que el código del backend esta en @code/backend.
ENTREGA: Guarda el prompt generado en la carpeta @sections_prompts/generated_prompts y hacer referencia en este apartado.

> **Prompt generado:** [`generated_prompts/nestjs-11.1-backend-agent-generation-prompt.md`](generated_prompts/nestjs-11.1-backend-agent-generation-prompt.md)

**Prompt 3: Revisar los artefactios de IA generados (Claude Opus 4.8)**
Eres un experto en crear artefactos (subagentes, skills, rules...) de IA con Claude. Quiero que revises los artefactos generados del proyecto en @.claude para darme una opinión, mejoras a realizar, incongluencias encontradas o especificaciones realizadas por duplicado. No modifiques nada, no presupongas ni inventes nada y pregunta todo lo que necesites.

**Prompt 4: Prompt para añadir TDD como metodología de implementación (Claude Opus 4.8)**
Eres un experto en creación de artefactos (subagentes, skill, rules, commands, tools, hook...) con Claude. Quiero implementar TDD y ya tengo un agente para implementación de frontend y otro agente para implementación de backend ¿Necesito agentes extras para implementar TDD en ambos casos? Mi idea era que estos agentes ya creados implementen, y tener otros agentes especializados en testing en frontend y backend y que todos los agentes trabajen en conjunto para implementar TDD. No quiero que tengas que dame la razón ni te inventes nada, dime la mejor opción que tu creas en función de datos reales que hacen en otros proyectos. Si tienes cualquier duda me lo preguntas. Dime que cambios o ficheros vas a crear antes de hacer nada.
