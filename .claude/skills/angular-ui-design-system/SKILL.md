---
name: angular-ui-design-system
description: Aplica el lenguaje visual de la landing pública (jpasoftware.com) al resto de pantallas del frontend Angular — tokens de color/espaciado, primitivas de botón, tarjeta y chip, tipografía, layout mobile-first, foco accesible y modo oscuro. Úsala cuando el usuario pida adaptar, unificar o rediseñar la apariencia de una pantalla (registro, login, horarios, catálogo, widget de reserva) para que se parezca a la landing, o cuando crees una pantalla nueva que deba encajar con ella. NUNCA toca el backend ni cambia comportamiento: solo estilos y marcado de presentación.
---

# Skill: Sistema de diseño de la UI (look & feel de la landing)

Unifica la apariencia del frontend Angular 22 tomando como **implementación de referencia** la
landing pública. El objetivo es que registro, login, backoffice y widget de reserva se vean como la
misma aplicación, sin reinventar valores ni duplicar estilos.

Esta skill cubre **presentación**: SCSS, clases de marcado y estructura visual. No cambia lógica de
componente, contratos de API ni tests de comportamiento.

## Fuente de verdad (OBLIGATORIO leer antes de tocar estilos)

1. **Tokens y línea base**: `code/frontend/src/styles.scss` — único sitio donde viven colores,
   espaciados, radios, sombra y la tipografía base. Si falta un valor, **se añade un token aquí**;
   nunca se escribe un hex suelto en una feature. Incluye además la capa base (reset de
   `box-sizing`, `body` con `--font-sans`/`--bg`/`--text`, `color-scheme: light dark`, controles de
   formulario heredando la fuente y el **anillo de foco global**).
2. **Primitivas compartidas**: partials en `code/frontend/src/styles/`, **uno por primitiva**:
   `_buttons.scss`, `_chips.scss`, `_titles.scss`, `_options.scss`, `_notices.scss`, `_forms.scss`.
   Se consumen desde el SCSS del componente con `@use '../../../styles/buttons';`.
3. **Implementación de referencia**: `code/frontend/src/app/features/home/home.scss` y
   `home.html` — de ahí salió el ritmo visual descrito abajo. Ante cualquier duda de "cómo se ve
   esto", **mira la landing antes de inventar**.
4. **Rules del proyecto** (mandan sobre esta skill si hay conflicto):
   - `.claude/rules/angular-templates-and-performance.md` §6 → SCSS con ámbito de componente,
     mobile-first, nada de valores mágicos repetidos, budgets de `angular.json`.
   - `.claude/rules/angular-forms-and-accessibility.md` §3 → contraste WCAG AA, foco visible,
     etiquetas y errores accesibles.
   - `.claude/rules/angular-testing-and-quality.md` → inglés, sin comentarios, Prettier, i18n.
   - `.claude/rules/file-naming.md` → nombres de fichero en inglés y `kebab-case`.

## Cuándo se activa

- "Adapta la pantalla X al estilo de la landing", "unifica el aspecto", "que se parezca a la home".
- Al crear una pantalla nueva que deba encajar visualmente con el resto.
- Al revisar una PR que introduce estilos y comprobar que no rompe el sistema.

## 1. El lenguaje visual

### 1.1. Tokens (definidos en `styles.scss`, con modo oscuro automático)

| Grupo | Tokens | Uso |
| :--- | :--- | :--- |
| Marca | `--brand`, `--brand-strong`, `--brand-soft`, `--accent` | Acción primaria, texto de énfasis, fondos suaves, degradados |
| Superficie | `--bg`, `--bg-alt`, `--surface`, `--surface-border` | Fondo de página, banda alterna, tarjetas, bordes |
| Texto | `--text`, `--text-muted`, `--on-brand` | Texto principal, secundario, sobre fondo de marca |
| Espaciado | `--space-xs` … `--space-2xl` (0.5 → 4rem) | Todo `gap`, `padding` y `margin` |
| Forma | `--radius-md`, `--radius-lg`, `--radius-pill` | Tarjetas, bandas, botones y chips |
| Otros | `--focus`, `--shadow` | Anillo de foco y elevación |

El bloque `@media (prefers-color-scheme: dark)` de `styles.scss` **redefine los mismos tokens**. Por
eso, una pantalla que use solo tokens obtiene el modo oscuro gratis; una que escriba hex se rompe en
oscuro. Esa es la razón técnica de la regla, no una preferencia estética.

### 1.2. Tipografía

- Títulos de página: `clamp(2rem, 8vw, 3rem)`, `line-height: 1.1`, `font-weight: 800`.
- Título de sección: `1.6rem`, peso `800`, centrado (`.section-title`).
- Título de tarjeta: `1.15rem`, peso `700`.
- Antetítulo (`hero__eyebrow`): `0.8rem`, peso `700`, `text-transform: uppercase`,
  `letter-spacing: 0.08em`, color `--brand-strong`.
- Texto secundario siempre `--text-muted`; pesos fuertes `600`/`700`/`800`, nunca `bold` suelto.

### 1.3. Layout y ritmo

- Contenedor: `max-width: 72rem` + `margin-inline: auto`, padding lateral `--space-lg`.
- Separación entre secciones: `--space-2xl`; dentro de una sección, `--space-lg`.
- **Mobile-first estricto**: se escribe la versión móvil y se escala con `min-width`. Los dos únicos
  breakpoints del sistema son **`40rem`** (móvil → tablet: rejillas a 3 columnas, hero en fila) y
  **`64rem`** (rejilla de features a 4 columnas). No introduzcas breakpoints nuevos sin justificar.

### 1.4. Acentos gráficos

- Hero: `radial-gradient(30rem 24rem at 100% 0%, var(--brand-soft), transparent 60%)`.
- Banda de CTA: `linear-gradient(135deg, var(--brand), var(--accent))` con texto `--on-brand`,
  `--radius-lg` y padding `--space-2xl`.
- Iconos: cuadro de `3rem` con `--radius-md`, fondo `--brand-soft` y color `--brand-strong`.
- Los iconos son **SVG inline** con `currentColor` y `aria-hidden="true"`, no una librería externa.

## 2. Primitivas reutilizables

Extraídas de la landing. Reprodúcelas **por composición, no copiando el CSS** en cada feature:

| Primitiva | Clases | Notas |
| :--- | :--- | :--- |
| Botón | `.button` + `.button--primary` / `--ghost` / `--light` | `_buttons.scss`. `--radius-pill`, peso 600, borde de 2px transparente, `:disabled` al 60 % |
| Chip | `.chip` | `_chips.scss`. Etiqueta no interactiva |
| Opción seleccionable | `.option` | `_options.scss`. Botón de lista (servicio, profesional, hora). El estado activo se pinta con `[aria-pressed='true']`, así que **la accesibilidad y el estilo no se pueden desincronizar** |
| Aviso | `.notice` + `.notice--error` / `--success` | `_notices.scss`. Para mensajes de estado, error y confirmación |
| Título de sección | `.section-title` | `_titles.scss` |
| Campo de formulario | `.field`, `.field__group`, `.field__suffix`, `.field__error`, `.field__status(--available/--taken)` | `_forms.scss`. El input se estiliza por descendencia (`.field input`) |
| Tarjeta | `.step` (sobre `--surface` con sombra) / `.feature-card` (sobre `--bg-alt`) | Aún local en `home.scss`: son composiciones propias de la landing |
| Cuadro de icono | `.step__icon` / `.feature-card__icon` | Ídem |
| Foco | `*:focus-visible` | **Global** en `styles.scss`; no lo repitas por componente |

**Cómo compartirlas (importante).** Viven en partials de `src/styles/` y se consumen con `@use`
desde el SCSS del componente, que mantiene el ámbito encapsulado:

```scss
@use '../../../styles/buttons';
@use '../../../styles/forms';
```

**No** las promuevas a `styles.scss` como CSS global: la rule de plantillas reserva lo global a
tokens y reset, y un `.button` global se filtraría a toda la app.

**Por qué un partial por primitiva.** Con `@use`, el CSS se inlinea en el componente, así que un
partial "cajón de sastre" engorda a todo el que lo importe. Pasó de verdad: agrupar botón, chip,
título, opción y aviso en un solo `_ui.scss` disparó `home.scss` a 4,67 kB y **rompió el budget
`anyComponentStyle`** (4 kB de aviso, 8 kB de error). Importa solo lo que uses; si necesitas una
primitiva nueva, créale su propio fichero en vez de ampliar uno existente. Y **nunca** subas el
budget para que quepa: es la señal de que estás importando de más.

## 3. Procedimiento para adaptar una pantalla

1. **Lee `home.scss`** y localiza la primitiva equivalente a lo que la pantalla ya hace a mano.
2. **Sustituye todo hex por tokens.** Si un color no existe como token, decide si es un caso nuevo
   (añade token en `styles.scss`) o si debe reutilizar uno existente (lo normal).
3. **Elimina las variables locales de color** que redefinan el sistema (p. ej. el bloque
   `--border-color`/`--focus-color`/`--text-color` de `tenant-registration.scss`): son la causa de
   que esa pantalla no siga la marca ni el modo oscuro.
4. **Aplica las primitivas** al marcado (`.button--primary` en la acción principal, `.section-title`
   en los encabezados, tarjetas para agrupar). Cambia clases, no la lógica del componente.
5. **Revisa mobile-first**: la versión base es la de móvil; escala en `40rem`/`64rem`.
6. **Accesibilidad**: foco visible en todo control, contraste AA, `aria-invalid` +
   `aria-describedby` en errores de formulario, live regions donde ya existan. No los quites al
   reestilizar.
7. **Modo oscuro**: comprueba la pantalla con `prefers-color-scheme: dark`.
8. **Verifica**: `ng test`, `ng build` (respeta los budgets) y Prettier.

## 4. Estado actual (auditoría, para priorizar)

Recuento de colores en duro frente a uso de tokens por hoja de estilo:

| Pantalla | Hex en duro | Estado |
| :--- | ---: | :--- |
| `styles.scss` (línea base) | 0 | ✅ tipografía, `body`, `color-scheme`, foco global |
| `features/home` | 0 | ✅ referencia; usa `buttons`, `chips`, `titles` |
| `features/tenant-registration` | 0 | ✅ usa `buttons`, `forms` |
| `features/booking` (widget, selection, slot-picker, contact-form) | 0 | ✅ usa `buttons`, `options`, `notices`, `forms` |
| `shared/language-switcher` | 0 | ✅ alineada |
| `features/schedule` (form y panel) | 0 | ✅ usa `buttons`, `forms`, `notices` |
| `features/catalog` (panel, service, employee) | 0 | ✅ usa `buttons`, `forms`, `notices` |
| `features/auth/login` | 0 | ✅ usa `buttons`, `forms`; ya no duplica los tokens |

Mide con: `grep -oE "#[0-9a-fA-F]{3,8}" <fichero>.scss | wc -l`. El objetivo de cada pantalla es
**cero**, y **ya se cumple en todas**; los tokens no se cuentan por fichero porque las primitivas
viven en los partials. Mantén la tabla en cero al añadir pantallas nuevas.

## 5. Reglas no negociables

- **Nunca** un hex, `px` de espaciado o radio suelto en una feature: token o primitiva.
- **Nunca** redefinir en una feature un token que ya existe globalmente.
- Código **en inglés y sin comentarios**; texto visible **siempre por i18n**, jamás en duro.
- SCSS con **ámbito de componente**; lo global se limita a tokens y reset en `styles.scss`.
- No subas los budgets de `angular.json` para que quepan estilos nuevos.
- Adaptar el aspecto **no cambia comportamiento**: si un test de comportamiento se rompe, el cambio
  está mal, no el test.

## 6. Checklist de "terminado"

- [ ] Cero hex nuevos; todo por tokens de `styles.scss`.
- [ ] Sin variables locales que dupliquen o pisen el sistema.
- [ ] Primitivas compartidas por `@use`, no copiadas.
- [ ] Móvil primero; solo breakpoints `40rem` / `64rem`.
- [ ] Foco visible, contraste AA y semántica de errores intactos.
- [ ] Correcta en claro **y** en oscuro.
- [ ] `ng test` y `ng build` en verde; Prettier sin cambios pendientes.

## 7. Deuda conocida del sistema (decidir antes de dar por cerrado el rediseño)

Detectado al extraer el sistema; **no lo arregles por tu cuenta sin avisar**, pero tenlo presente:

- **La pantalla de registro no tiene encabezado**: es un formulario suelto, sin `<h1>` ni marca. Es
  un hueco de accesibilidad (página sin título visible) además de estético, pero añadirlo introduce
  **texto nuevo**, que exige IDs `i18n` y su traducción en `src/locale/messages.es.xlf`. Decisión de
  producto: pregunta antes de escribir copy.
- Las dos excepciones de hex de `.button--light` en oscuro (ahora en `_ui.scss`) merecen su propio
  token en lugar de valores literales.
- El backoffice y el widget siguen sin tokens; hasta adaptarlos convivirán dos estéticas.

Resuelto ya (no lo rehagas): línea base tipográfica y de `body`, `color-scheme: light dark`, anillo
de foco global y `<title>` de `index.html`.
