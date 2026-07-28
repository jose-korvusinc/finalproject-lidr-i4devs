# Regla: Seguridad en GitHub Actions (secretos, permisos y cadena de suministro)

Esta regla define las **prácticas de seguridad obligatorias** de los workflows de GitHub Actions,
en especial cuando manejan la **clave privada SSH** y las credenciales de despliegue al EC2.
Complementa `github-actions-workflows.md` (estructura) y `aws-ec2-ssh-deployment.md` (uso concreto
de la clave en el host). Es un requisito de seguridad, no una recomendación opcional.

Fuente de verdad: **documentación oficial de GitHub Actions** — guía *Secure use of GitHub Actions*
(*Security hardening*). No relajes ninguna de estas medidas sin justificación documentada.

## 1. Secretos: cifrados, nunca en claro, nunca en logs

- **Todo** dato sensible (clave privada SSH, host, usuario de despliegue, tokens) se guarda como
  **encrypted secret** de GitHub (a nivel de repositorio o, preferido para despliegue, de
  **environment**, ver §5). La documentación es explícita: *sensitive data should never be stored as
  plaintext in workflow files*.
- **Nunca** imprimas ni loguees un secreto (`echo "$SSH_KEY"` a stdout, `set -x` sobre comandos con
  secretos, volcado de variables). Si un secreto aparece en logs: **elimina el log y rota la
  credencial** de inmediato.
- Referencia los secretos solo vía `${{ secrets.NAME }}`; GitHub los **enmascara** en los logs. Si
  generas o transformas un valor sensible en tiempo de ejecución, regístralo con `::add-mask::VALUE`
  para que también se redacte.
- La clave privada **no** se commitea jamás al repo (coherente con `*.pem` en `.gitignore`); vive
  solo como secreto. En este proyecto, `jpasoftware.pem` está gitignorada y **no** debe subirse.

## 2. `GITHUB_TOKEN` con privilegio mínimo

- Declara `permissions` explícitamente y parte de **solo lectura**: *it's good security practice to
  set the default permission for the `GITHUB_TOKEN` to read access only*. Eleva permisos por job solo
  cuando un step los exija.
- Un workflow de despliegue por SSH normalmente solo necesita `contents: read`. No concedas
  `write`/`packages`/`id-token` salvo que un paso concreto lo requiera.

```yaml
permissions:
  contents: read
```

## 3. Cadena de suministro: fija las acciones por SHA completo

- **Pinea toda acción de terceros a un commit SHA de longitud completa**: *pinning an action to a
  full-length commit SHA is currently the only way to use an action as an immutable release*. Un tag
  (`@v4`) o rama es mutable y puede ser sustituido por un atacante.
- No uses acciones de terceros para el transporte SSH en este proyecto (decisión del proyecto: SSH
  nativo del runner, ver `aws-ec2-ssh-deployment.md`). Para las acciones **oficiales** que sí uses
  (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`), fíjalas igualmente por SHA
  y anota la versión en un comentario.

```yaml
- uses: actions/checkout@<full-commit-sha> # v4.x.x
```

## 4. Prevención de inyección de scripts

- **No** interpoles entrada no confiable directamente en un `run:` con `${{ ... }}` (títulos de PR,
  nombres de rama, cuerpos de issue, etc.): permite **command injection**. Pásala por una **variable
  de entorno intermedia** y referénciala entrecomillada en el shell.

✅ Mitigación oficial:

```yaml
env:
  TITLE: ${{ github.event.pull_request.title }}
run: echo "$TITLE"
```

- En los `run` de despliegue, construye los comandos SSH/rsync con los secretos vía `env:` y comillas
  dobles; nunca concatenes expresiones `${{ }}` de contexto no confiable dentro del comando remoto.

## 5. Environments con reglas de protección para el despliegue

- Los secretos de despliegue (clave SSH, host, usuario) se alojan en un **environment** de GitHub
  (p. ej. `production`), no como secretos sueltos del repo. Un environment permite **required
  reviewers**: *a workflow job cannot access environment secrets until approval is granted by a
  reviewer*.
- Restringe el environment a la rama de despliegue permitida (deployment branch rules) y exige
  aprobación humana antes de tocar producción. El job de deploy declara `environment: production`.

## 6. OIDC frente a credenciales de larga vida (contexto)

- La recomendación oficial de GitHub para autenticar contra **APIs de proveedores cloud** (p. ej. la
  API de AWS) es **OpenID Connect (OIDC)** con tokens de corta vida y bien acotados, en lugar de
  guardar credenciales de larga vida como secretos.
- **Matiz de este proyecto**: el despliegue es **SSH a un host EC2** con **clave privada** (decisión
  del proyecto), que es un caso distinto del acceso a la API de AWS. Por tanto:
  - La clave SSH se trata como secreto de larga vida: **acótala y rótala** (ver
    `aws-ec2-ssh-deployment.md`), úsala solo desde el environment protegido y con un usuario de
    despliegue de mínimo privilegio en el host.
  - El workflow **sí** llama a la API de AWS para el **whitelisting dinámico del puerto 22**
    (decisión del proyecto, ver `aws-ec2-ssh-deployment.md` §1.1): esa autenticación se hace por
    **OIDC** con `permissions: id-token: write` y un **rol IAM acotado**
    (`ec2:AuthorizeSecurityGroupIngress`/`RevokeSecurityGroupIngress`/`DescribeSecurityGroups`),
    **nunca** con claves de acceso estáticas. Fija `aws-actions/configure-aws-credentials` (acción
    oficial) por **SHA completo**.
  - Cualquier otra necesidad futura contra la API de AWS (SSM, S3, ECR) sigue el mismo criterio:
    OIDC + rol IAM mínimo, no claves de larga vida.

## 7. Endurecimiento adicional

- **Runner**: en GitHub-hosted runners no persistas secretos en disco más allá del job; el runner es
  efímero. Si algún requisito exige self-hosted, endurécelo (aislado, efímero, no en repos públicos).
- **Principio de mínima superficie**: no expongas variables sensibles como outputs de step/job ni las
  pases a acciones de terceros.
- **Dependabot/actualización**: mantén al día las acciones fijadas por SHA (revisando el changelog),
  equilibrando inmutabilidad y parches de seguridad.
