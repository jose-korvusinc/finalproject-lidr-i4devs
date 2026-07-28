# Regla: Estructura y convenciones de workflows de GitHub Actions

Esta regla define **cómo se estructuran los workflows** de GitHub Actions del proyecto (CI y CD).
Cubre la organización, los disparadores, los permisos y el ciclo de vida de un workflow. La
**seguridad** (secretos, pin de acciones, inyección de scripts, OIDC, environments) es competencia
de `github-actions-security.md`; el **transporte de despliegue por SSH al EC2** y el patrón
build-and-copy + Nginx es competencia de `aws-ec2-ssh-deployment.md`. Los nombres de fichero siguen
`file-naming.md`.

Fuente de verdad: **documentación oficial de GitHub Actions** (docs.github.com/actions). No
inventes claves de sintaxis ni comportamientos no documentados; ante la duda, consulta la referencia
de *workflow syntax* y *events that trigger workflows*.

## 1. Ubicación y nomenclatura

- Los workflows viven **solo** en `.github/workflows/` en la raíz del repositorio; un fichero `.yml`
  por workflow, en inglés y `kebab-case` (`ci.yml`, `deploy.yml`). Es una ruta fijada por GitHub
  (excepción de `file-naming.md`).
- Da a cada workflow un `name` descriptivo en inglés y a cada `job`/`step` un `name` claro. El
  contenido de etiquetas y logs va en inglés (coherente con el resto del código).
- Separa **CI** (build + lint + test en cada push/PR) de **CD** (despliegue al EC2). No mezcles el
  despliegue a producción con la validación de PRs en el mismo job.

## 2. Disparadores (`on`) explícitos y acotados

- Declara los eventos de forma explícita; **no** dispares el despliegue en cualquier push.
  - **CI**: `on: [pull_request]` y `push` a ramas de integración; acota con `paths` a `code/**`
    cuando proceda para no lanzar builds innecesarios.
  - **CD**: dispara el despliegue de producción de forma controlada — `push` a la rama por defecto
    (`main`), `release: [published]`, o `workflow_dispatch` (manual). Elige uno y documéntalo; ante
    la duda de política, **pregunta** antes de asumir.
- Usa `workflow_dispatch` para despliegues manuales reproducibles; añade `inputs` tipados si el
  despliegue necesita parámetros (p. ej. `environment`).

✅ Disparador de CD acotado:

```yaml
on:
  push:
    branches: [main]
    paths: ["code/**"]
  workflow_dispatch:
```

## 3. Jobs, runners y dependencias

- Fija el runner con una etiqueta **versionada**, no flotante ambigua: `runs-on: ubuntu-24.04` (o la
  versión soportada vigente), no confíes ciegamente en `ubuntu-latest` para despliegues reproducibles.
- Ordena las dependencias entre jobs con `needs:`; el job de **deploy `needs:` el job de build/test**
  para no desplegar código que no pasa la suite.
- Usa `matrix` solo cuando aporte (varias versiones de Node, front y back en paralelo); no la fuerces.
- Aísla responsabilidades por job: `build`, `test`, `deploy`. Un job hace una cosa.

## 4. Concurrencia (evita despliegues solapados)

- Protege el despliegue con `concurrency` para que dos ejecuciones no pisen el mismo host a la vez.
  Para CD a producción, **no** canceles a mitad un despliegue en curso (`cancel-in-progress: false`);
  para CI de PRs sí conviene cancelar ejecuciones obsoletas.

```yaml
concurrency:
  group: deploy-production
  cancel-in-progress: false
```

## 5. Permisos mínimos del `GITHUB_TOKEN`

- Declara `permissions` de forma explícita a nivel de workflow con el **mínimo** necesario; la
  recomendación oficial es partir de solo lectura y elevar por job lo justo (ver
  `github-actions-security.md` §2).
- El job de **deploy** de este proyecto necesita además `id-token: write` para autenticarse a la API
  de AWS por **OIDC** (whitelisting dinámico del puerto 22, ver `aws-ec2-ssh-deployment.md` §1.1).
  Concede `id-token: write` **solo** en ese job, no a nivel global.

```yaml
permissions:
  contents: read
# en el job de deploy:
#   permissions: { contents: read, id-token: write }
```

## 6. Caché y artefactos

- Cachea dependencias con la caché oficial (p. ej. `actions/setup-node` con `cache: npm`) para
  acelerar `npm ci`; la clave de caché incluye el hash del lockfile. No caches secretos ni
  `node_modules` de producción como artefacto público.
- Pasa artefactos entre jobs (build → deploy) con `actions/upload-artifact`/`download-artifact`
  cuando el build y el deploy sean jobs separados, para desplegar **exactamente** lo construido y
  validado, sin reconstruir en el job de deploy.

## 7. Reutilización

- Extrae lógica repetida a **reusable workflows** (`on: workflow_call`) o a un composite action
  local en `.github/actions/` en vez de duplicar steps entre `ci.yml` y `deploy.yml`.
- Fija **toda** acción de terceros por SHA completo (ver `github-actions-security.md` §3).

## 8. Environments y despliegue protegido

- El despliegue a producción usa un **environment** de GitHub (`environment: production`) que aloja
  los secretos de despliegue (clave SSH, host, usuario) y aplica **reglas de protección** (revisores
  requeridos, ramas permitidas). Detalle en `github-actions-security.md` §5.

```yaml
jobs:
  deploy:
    needs: [build, test]
    runs-on: ubuntu-24.04
    environment: production
```

## 9. Trazabilidad y calidad del workflow

- Cada workflow se rastrea a una necesidad real (validar PRs, desplegar la release). No añadas jobs
  “por si acaso”.
- Mantén los steps legibles; si un `run` crece, extrae un script versionado en el repo (p. ej.
  `code/scripts/deploy.sh`) e invócalo, en lugar de incrustar shell complejo en el YAML.
- Valida el workflow (sintaxis y ejecución real en una rama) antes de fusionarlo a la rama de
  despliegue; un workflow de CD roto no se descubre en producción.
