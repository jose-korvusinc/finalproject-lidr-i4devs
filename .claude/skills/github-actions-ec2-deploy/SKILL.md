---
name: github-actions-ec2-deploy
description: Genera y mantiene el pipeline de CI/CD en GitHub Actions que despliega la app (frontend Angular + backend NestJS) a un servidor AWS EC2 por SSH con clave privada, usando el patrón build-and-copy + Nginx y transporte SSH/rsync nativo (sin acciones de terceros). Úsala cuando el usuario pida crear, generar o modificar workflows de GitHub Actions, el despliegue al EC2, o el fichero .github/workflows/deploy.yml. Aplica SIEMPRE las rules `github-actions-*` y `aws-ec2-ssh-deployment.md` como única fuente de verdad; documenta los secretos necesarios y NO commitea la clave privada.
---

# Skill: CI/CD con GitHub Actions y despliegue a EC2 por SSH

Genera y mantiene el pipeline de **CI/CD** del proyecto: valida el código (build + lint + test) y
**despliega a un EC2 de AWS por SSH con clave privada**, con el patrón **build-and-copy + Nginx** y
**transporte SSH/`rsync` nativo del runner** (sin acciones de terceros). La skill **no inventa**
convenciones: las toma de las rules, que son la **única fuente de verdad**. Se restringe a lo
**documentado** en GitHub Actions y AWS EC2; ante cualquier decisión no cubierta, **pregunta**.

## Fuente de verdad (OBLIGATORIO leer antes de escribir el workflow)

Lee y aplica SIEMPRE estas rules. Si hay conflicto, las rules mandan sobre cualquier suposición:

- `.claude/rules/github-actions-workflows.md` → estructura, disparadores `on`, jobs/`needs`,
  runner versionado, `concurrency`, `permissions` mínimos, caché, artefactos, environments.
- `.claude/rules/github-actions-security.md` → secretos cifrados (nunca en logs), `GITHUB_TOKEN`
  read-only, pin de acciones por **SHA completo**, prevención de inyección de scripts (env var
  intermedia), environments con revisores, OIDC vs credenciales de larga vida.
- `.claude/rules/aws-ec2-ssh-deployment.md` → clave a fichero `600`/`ssh-agent`, `known_hosts`
  fijado (sin `StrictHostKeyChecking=no`), `rsync`/`scp` de artefactos, comando remoto no
  interactivo, `sudo` acotado, recarga de `systemd`/Nginx, health check, rollback, rotación.

Y `.claude/rules/file-naming.md` (nombres) y `.claude/rules/nestjs-architecture.md` §6 (graceful
shutdown al recargar). No copies el contenido de las rules aquí: léelas en tiempo de ejecución.

## Decisiones del proyecto (ya tomadas — no las cambies sin preguntar)

- **Mecanismo de despliegue**: build-and-copy + Nginx (CI construye; se copian artefactos al host;
  se recargan servicios). **Sin Docker en el host.**
- **Transporte**: SSH/`rsync`/`scp` **nativos** del runner. **Prohibido** usar acciones de terceros
  para el SSH (p. ej. `appleboy/ssh-action`).
- **Autenticación al host**: **clave privada SSH** guardada como secreto (para el SSH al host, no
  OIDC).
- **Apertura del puerto 22**: **whitelisting dinámico de la IP del runner** (patrón más adoptado por
  la comunidad para SSH+`.pem` desde runners hosted). El 22 está cerrado por defecto; el job de
  deploy lo abre solo a la IP del runner y lo **revoca con `if: always()`**. La API de AWS se llama
  por **OIDC** (`aws-actions/configure-aws-credentials`, oficial, fijada por SHA;
  `permissions: id-token: write` solo en ese job) con un **rol IAM acotado**
  (`ec2:AuthorizeSecurityGroupIngress`/`RevokeSecurityGroupIngress`/`DescribeSecurityGroups`).
  **Nunca** claves de acceso estáticas ni `0.0.0.0/0` en el 22. Detalle en
  `aws-ec2-ssh-deployment.md` §1.1. Requiere alta única en AWS del **OIDC provider** y el **rol IAM**.
- **Disparador**: `push` a la rama **`main`** (más `workflow_dispatch` para despliegue manual).
- **Entorno del frontend**: **no hay `.env` de runtime**. El build de Angular es estático y usa URLs
  **relativas** (`/api/v1/...`) que resuelve **Nginx** (reverse proxy) en el host. No generes ni
  copies ningún `.env` para el frontend; nunca metas secretos en el bundle del navegador. El
  `proxy.conf.json` es **solo de desarrollo** (`ng serve`).
- **Entorno del backend**: `@nestjs/config` lee las variables en **runtime**; el `.env` está
  gitignored y **no** se copia en el build. Las variables de producción viven en el host como
  **`EnvironmentFile`** de systemd (`/etc/bookings-api/api.env`, root, `600`). Decisión del proyecto:
  el **pipeline inyecta** ese fichero — lo **renderiza desde secretos del environment `production`**
  (con permisos `600`) y lo copia por `rsync` al host antes de reiniciar el servicio. Los secretos de
  aplicación **nunca** se commitean; van en el environment protegido y se rotan.

## Antes de escribir: reconoce el proyecto real

Lee y respeta la configuración instalada (no asumas):

- `code/frontend/package.json` y `angular.json` → comando y ruta de salida del build (`ng build`,
  `dist/`), versión de Angular/Node.
- `code/backend/package.json` y `nest-cli.json` → build (`nest build`, `dist/`), scripts de `lint`,
  `test`, `test:e2e`, versión de NestJS/Node, y si hay migraciones (`migrate-mongo`).
- `.gitignore` → confirma que `*.pem` está ignorada; la clave **nunca** se commitea.
- Estructura del monorepo: front en `code/frontend`, back en `code/backend`.
- Si algo del despliegue no está definido (rutas en el host, usuario SSH, política de disparo,
  apertura del puerto 22, releases atómicas sí/no), **pregunta** antes de generar; no inventes.

## Flujo de trabajo

1. **Leer las rules** `github-actions-*`, `aws-ec2-ssh-deployment.md` y `file-naming.md`.
2. **Reconocer el proyecto** (sección anterior): comandos de build/test reales de front y back,
   versión de Node, rutas de destino en el host.
3. **Confirmar los parámetros de despliegue** con el usuario si faltan: disparador (push a `main` /
   `release` / `workflow_dispatch`), usuario y host SSH, rutas (`/var/www/app`, `/srv/api`), nombre
   del environment (`production`), y si se aplican releases atómicas.
4. **Generar `.github/workflows/deploy.yml`** (y `ci.yml` si procede) siguiendo las rules:
   - `name`, `on` acotado, `permissions: contents: read`, `concurrency` sin cancelar el deploy.
   - Job **build/test**: `checkout` + `setup-node` (con caché), `npm ci`, build de front y back,
     `lint` y `test`; sube los artefactos (`upload-artifact`) si el deploy es un job separado.
   - Job **deploy** (`needs: [build, test]`, `environment: production`): escribe la clave con
     permisos `600` (o `ssh-agent`), fija `known_hosts`, `rsync` de artefactos, comando remoto no
     interactivo (`bash -euo pipefail`) con `npm ci --omit=dev`, migraciones si aplica,
     `systemctl restart api` / `reload nginx`, **health check** y limpieza de la clave.
   - **Acciones oficiales fijadas por SHA completo** (con la versión en comentario); **cero**
     acciones de terceros para el SSH.
5. **Documentar los secretos requeridos** (ver checklist) en la salida y, si el proyecto mantiene
   `sections_readme/09-installation-instructions.md`, añade allí cómo configurarlos (sin valores).
6. **No** subir la clave ni ningún secreto al repo. **No** usar `StrictHostKeyChecking=no`.
7. **Verificar** el YAML: sintaxis válida, secretos referenciados existen como placeholders,
   ningún secreto se imprime, disparador y permisos correctos. Recomienda probar el workflow en una
   rama antes de fusionar a la rama de despliegue.

## Secretos requeridos (documéntalos; nunca sus valores)

Aloja estos secretos en el **environment** `production` (no como secretos sueltos del repo):

Transporte SSH:

- `SSH_PRIVATE_KEY` — clave privada de despliegue (la pública autorizada en el usuario `deploy` del EC2).
- `SSH_HOST` — DNS público o IP del EC2.
- `SSH_USER` — usuario SSH (p. ej. `deploy`, o el de la AMI: `ec2-user`/`ubuntu`).
- `SSH_KNOWN_HOSTS` — entrada de `known_hosts` del EC2 (fingerprint verificado contra la consola AWS).

Whitelisting dinámico del puerto 22 (OIDC + API de AWS):

- `AWS_ROLE_ARN` — ARN del rol IAM asumible por OIDC (permisos mínimos de security group).
- `AWS_REGION` — región del EC2/security group.
- `AWS_SECURITY_GROUP_ID` — id del security group cuyo puerto 22 se abre/revoca.
  (No es secreto per se; puede ir como variable del environment si se prefiere.)

Entorno de la app backend (se renderizan a `/etc/bookings-api/api.env` con permisos `600`):

- `MONGODB_URI` — cadena de conexión con el usuario de mínimo privilegio y `authSource` correcto.
- `MONGODB_DB` — base de datos de la aplicación (`bookings`).
- Futuras (`JWT_SECRET`, `REDIS_URL`, …) siguen el mismo patrón.
- Los **no sensibles** (`NODE_ENV=production`, `PORT=3000`) puede fijarlos el propio workflow como
  texto, no requieren ser secretos.

El **frontend no aporta secretos ni `.env`**: es un build estático con URLs relativas resueltas por
Nginx.

## Esqueleto de referencia (adáptalo a los comandos reales del proyecto)

```yaml
name: Deploy to EC2
on:
  push:
    branches: [main]
    paths: ["code/**"]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: deploy-production
  cancel-in-progress: false
jobs:
  build-test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: actions/setup-node@<sha> # v4
        with: { node-version: "24", cache: "npm" }
      # npm ci + build + lint + test for code/frontend and code/backend
      # upload-artifact: code/frontend/dist and code/backend/dist
  deploy:
    needs: [build-test]
    runs-on: ubuntu-24.04
    environment: production
    permissions:
      contents: read
      id-token: write # OIDC para llamar a la API de AWS (whitelisting del puerto 22)
    steps:
      - uses: actions/checkout@<sha> # v4
      # download-artifact (dist de front y back)
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@<sha> # official; pin by SHA
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
      - name: Open port 22 for this runner
        id: sg
        env:
          SECURITY_GROUP_ID: ${{ secrets.AWS_SECURITY_GROUP_ID }}
        run: |
          RUNNER_IP="$(curl -fsS https://checkip.amazonaws.com)"
          echo "runner_ip=$RUNNER_IP" >> "$GITHUB_OUTPUT"
          aws ec2 authorize-security-group-ingress \
            --group-id "$SECURITY_GROUP_ID" --protocol tcp --port 22 --cidr "${RUNNER_IP}/32"
      - name: Prepare SSH key and known_hosts
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SSH_KNOWN_HOSTS: ${{ secrets.SSH_KNOWN_HOSTS }}
        run: |
          install -m 600 /dev/null key.pem
          printf '%s\n' "$SSH_PRIVATE_KEY" > key.pem
          mkdir -p ~/.ssh && chmod 700 ~/.ssh
          printf '%s\n' "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
      - name: Render backend env file (600)
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          MONGODB_DB: ${{ secrets.MONGODB_DB }}
        run: |
          install -m 600 /dev/null api.env
          {
            printf 'MONGODB_URI=%s\n' "$MONGODB_URI"
            printf 'MONGODB_DB=%s\n' "$MONGODB_DB"
            printf 'NODE_ENV=production\n'
            printf 'PORT=3000\n'
          } > api.env
      - name: Copy artifacts, env and reload services
        env:
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USER: ${{ secrets.SSH_USER }}
        run: |
          rsync -az --delete -e "ssh -i key.pem" code/frontend/dist/frontend/browser/ "$SSH_USER@$SSH_HOST:/var/www/app/"
          rsync -az --delete -e "ssh -i key.pem" code/backend/dist/  "$SSH_USER@$SSH_HOST:/srv/api/dist/"
          rsync -az -e "ssh -i key.pem" code/backend/package.json code/backend/package-lock.json "$SSH_USER@$SSH_HOST:/srv/api/"
          rsync -az --chmod=600 -e "ssh -i key.pem" api.env "$SSH_USER@$SSH_HOST:/etc/bookings-api/api.env"
          ssh -i key.pem "$SSH_USER@$SSH_HOST" 'bash -euo pipefail -s' <<'EOF'
            export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22
            cd /srv/api
            npm ci --omit=dev
            sudo systemctl restart api
            sudo systemctl reload nginx
          EOF
      - name: Revoke port 22
        if: always()
        env:
          SECURITY_GROUP_ID: ${{ secrets.AWS_SECURITY_GROUP_ID }}
          RUNNER_IP: ${{ steps.sg.outputs.runner_ip }}
        run: |
          [ -n "$RUNNER_IP" ] && aws ec2 revoke-security-group-ingress \
            --group-id "$SECURITY_GROUP_ID" --protocol tcp --port 22 --cidr "${RUNNER_IP}/32" || true
      - name: Cleanup
        if: always()
        run: rm -f key.pem api.env
```

## Lista de verificación de calidad (antes de terminar)

- [ ] He leído las rules `github-actions-*` y `aws-ec2-ssh-deployment.md` como fuente de verdad.
- [ ] `on` acotado; `permissions: contents: read`; `concurrency` sin cancelar el deploy en curso.
- [ ] Deploy `needs:` el job de build/test; runner con versión fija.
- [ ] **Ninguna** acción de terceros para el SSH; acciones oficiales fijadas por **SHA completo**.
- [ ] **Puerto 22**: cerrado por defecto; el job lo abre solo a la IP del runner (`/32`) vía OIDC +
      AWS CLI y lo **revoca con `if: always()`** con la misma IP; `id-token: write` solo en el job de
      deploy; rol IAM con permisos mínimos de security group; sin claves AWS estáticas ni `0.0.0.0/0`.
- [ ] La clave se escribe con permisos `600` (o `ssh-agent`) y se elimina al final; **nunca** se
      imprime; **no** se commitea (`*.pem` en `.gitignore`).
- [ ] `known_hosts` fijado; **sin** `StrictHostKeyChecking=no`.
- [ ] Entrada no confiable pasada por env var intermedia (sin inyección de scripts).
- [ ] Secretos alojados en el environment `production` con revisores; documentados sin valores.
- [ ] Comando remoto `bash -euo pipefail`; recarga de `systemd`/Nginx; **health check** que hace
      fallar el job si no responde; rollback documentado.
- [ ] **Frontend**: no se genera ni copia `.env`; build estático con URLs relativas resueltas por
      Nginx; Nginx sirve la SPA (`try_files … /index.html`) y proxya `/api` a la API.
- [ ] **Backend**: `api.env` renderizado desde secretos del environment, con permisos `600`, copiado
      a `/etc/bookings-api/api.env`; consumido por systemd (`EnvironmentFile`); `api.env` local
      eliminado al final (`rm -f`). Nunca se commitean secretos de app.

## Ejemplos de invocación

- "Crea el workflow de despliegue a EC2 por SSH para el front y el back."
- "Añade el job de CI (lint + test) que precede al despliegue."
- "Cambia el disparador del deploy a `workflow_dispatch` manual y documenta los secretos."
