# Regla: Despliegue a EC2 por SSH con clave privada (build-and-copy + Nginx)

Esta regla define **cómo desplegar** la aplicación (frontend Angular + backend NestJS) a un servidor
**AWS EC2** desde GitHub Actions, usando **SSH con un fichero de clave privada** y el patrón
**build-and-copy + Nginx** (CI construye; se copian los artefactos al host; se recargan los
servicios). Cubre el transporte SSH y el lado AWS/host. Complementa `github-actions-workflows.md`
(estructura del workflow) y `github-actions-security.md` (manejo del secreto de la clave). El
mecanismo de despliegue (build-and-copy + Nginx, sin Docker en el host) es una **decisión del
proyecto**.

Fuente de verdad: **documentación oficial de AWS EC2** (conexión a instancias Linux por SSH,
security groups) y **documentación oficial de GitHub Actions** para la parte del runner. No uses
acciones de terceros para el transporte: **SSH/`rsync`/`scp` nativos** del runner (decisión del
proyecto).

## 1. Lado AWS: prerrequisitos del host (documentados por AWS)

- **Clave privada y permisos**: la clave (`.pem`) debe tener permisos restrictivos; AWS documenta
  `chmod 400 key.pem` para conectar desde tu máquina (SSH rechaza la clave si es demasiado abierta:
  *UNPROTECTED PRIVATE KEY FILE*). En el runner de CI se usa `chmod 600` sobre el fichero temporal
  (ver §3).
- **Usuario SSH por AMI**: usa el usuario por defecto de la AMI — `ec2-user` (Amazon Linux),
  `ubuntu` (Ubuntu), etc. **No** despliegues como `root`.
- **Security group**: el grupo de seguridad de la instancia **no** deja el puerto 22 abierto a
  internet. Los GitHub-hosted runners no tienen IP fija; la **decisión del proyecto** (patrón más
  adoptado por la comunidad para SSH+`.pem` desde runners hosted) es el **whitelisting dinámico de
  la IP del runner** (ver §1.1). **Nunca** `0.0.0.0/0` en el 22.
- **Verificación de host (known_hosts)**: en la primera conexión SSH pide confirmar el *fingerprint*
  del host. En CI hay que **fijar** ese host de antemano (ver §4) para no aceptar ciegamente claves
  de host (riesgo MITM).

## 1.1. Apertura dinámica del puerto 22 (decisión del proyecto)

El puerto 22 permanece **cerrado** por defecto y el workflow lo abre **solo a la IP del runner**
durante el despliegue, revocándolo al terminar. Es el patrón más adoptado por la comunidad para este
caso (SSH + `.pem` desde runners hosted). Autenticación a la API de AWS por **OIDC** (rol IAM
temporal), **no** con claves de acceso de larga vida (coherente con `github-actions-security.md` §6).

Requisitos AWS (alta única, fuera del workflow):

- **OIDC identity provider** para `token.actions.githubusercontent.com` en la cuenta AWS.
- **Rol IAM** asumible por OIDC (trust con `sts:AssumeRoleWithWebIdentity` y condición de
  `aud`/`sub` acotada a este repo/rama), con **permisos mínimos**:
  `ec2:AuthorizeSecurityGroupIngress`, `ec2:RevokeSecurityGroupIngress`, `ec2:DescribeSecurityGroups`
  (acótalos por `Resource`/condición al security group concreto cuando sea posible).

Flujo en el job de deploy:

1. `permissions: { id-token: write, contents: read }` y autenticación con la acción **oficial**
   `aws-actions/configure-aws-credentials` (`role-to-assume`), fijada por SHA completo.
2. Obtener la IP pública del runner (p. ej. `curl`/`dig` a un resolutor de IP) y abrir la regla:

```yaml
run: |
  RUNNER_IP="$(curl -fsS https://checkip.amazonaws.com)"
  aws ec2 authorize-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp --port 22 --cidr "${RUNNER_IP}/32"
```

3. Desplegar por SSH/`rsync` (transporte nativo; sin cambios respecto al resto de la regla).
4. **Revocar siempre** la regla al final, con `if: always()`, para no dejar el 22 abierto:

```yaml
if: always()
run: |
  aws ec2 revoke-security-group-ingress \
    --group-id "$SECURITY_GROUP_ID" \
    --protocol tcp --port 22 --cidr "${RUNNER_IP}/32"
```

Notas: `configure-aws-credentials` es una acción **oficial de AWS** para la API de AWS (no para el
SSH); la prohibición de acciones de terceros para el transporte SSH se mantiene. Propaga `RUNNER_IP`
entre steps (output/env) para revocar exactamente la misma regla que abriste.

## 2. Preparación del host (una vez, fuera del workflow)

- **Usuario de despliegue de mínimo privilegio**: crea un usuario dedicado (p. ej. `deploy`) dueño de
  las rutas de despliegue; **no** uses `root`. Su clave pública autorizada corresponde a la privada
  guardada como secreto.
- **Rutas**: define destinos estables, p. ej. frontend en `/var/www/app` (raíz de Nginx) y backend
  en `/srv/api`. El usuario `deploy` debe poder escribir en ellas.
- **Nginx**: sirve la SPA de Angular como estáticos y hace de **reverse proxy** a la API NestJS
  (coherente con la topología de producción del proyecto). Su configuración vive en el host.
- **Servicio de la API**: NestJS corre como servicio gestionado (**systemd**), arrancable/recargable
  sin sesión interactiva.
- **`sudo` acotado**: si el reinicio de servicios requiere privilegios, concede al usuario `deploy`
  un `sudoers` **con NOPASSWD y limitado** exactamente a los comandos necesarios (p. ej.
  `systemctl restart api`, `systemctl reload nginx`), nunca `sudo` total.
- **Node en el host**: instala la versión de Node soportada por el backend para ejecutar
  `npm ci --omit=dev` en `/srv/api` (o copia también `node_modules` de producción desde CI; decide
  una estrategia y documéntala).

## 3. Manejo de la clave privada en el runner

- La clave privada es un **secreto de environment** (`SSH_PRIVATE_KEY`), nunca un fichero del repo
  (ver `github-actions-security.md`). En el job:
  - Escríbela a un fichero temporal con **permisos `600`** y úsala con `ssh -i`.
  - Alternativa preferida: cárgala en un **`ssh-agent`** efímero del job en vez de dejarla en disco.
  - **Nunca** la imprimas ni la pases a acciones de terceros.

✅ Clave a fichero temporal con permisos correctos:

```yaml
env:
  SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
  SSH_HOST: ${{ secrets.SSH_HOST }}
  SSH_USER: ${{ secrets.SSH_USER }}
run: |
  install -m 600 /dev/null key.pem
  printf '%s' "$SSH_PRIVATE_KEY" > key.pem
```

## 4. Fijar el host (known_hosts), sin aceptar ciegamente

- **No** uses `StrictHostKeyChecking=no` en producción: acepta cualquier clave de host y abre la
  puerta a MITM. Fija el host de una de estas formas:
  - Preferido: guarda la entrada de `known_hosts` del EC2 como **secreto** (`SSH_KNOWN_HOSTS`) y
    escríbela en el runner; su valor se obtiene una vez, de forma verificada, con
    `ssh-keyscan -t ed25519 <host>` **contrastando** el fingerprint contra el que muestra la consola
    de EC2.
  - Acota `ssh-keyscan` en el propio job solo si asumes conscientemente el TOFU; documenta el riesgo.

```yaml
run: |
  mkdir -p ~/.ssh && chmod 700 ~/.ssh
  printf '%s\n' "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
```

## 5. Construir en CI y copiar los artefactos (build-and-copy)

- **Construye en el runner**, no en el host: `npm ci` + build de front (`ng build` → `dist/`) y de
  back (`nest build` → `dist/`). Ejecuta lint y tests **antes** de desplegar (el job de deploy
  `needs:` el de test, ver `github-actions-workflows.md` §3).
- **Copia** los artefactos ya construidos y validados con `rsync` sobre SSH (idempotente y
  eficiente; `--delete` para dejar el destino exactamente igual al artefacto):

```yaml
run: |
  rsync -az --delete -e "ssh -i key.pem" \
    code/frontend/dist/ "$SSH_USER@$SSH_HOST:/var/www/app/"
  rsync -az --delete -e "ssh -i key.pem" \
    code/backend/dist/  "$SSH_USER@$SSH_HOST:/srv/api/dist/"
  rsync -az -e "ssh -i key.pem" \
    code/backend/package.json code/backend/package-lock.json \
    "$SSH_USER@$SSH_HOST:/srv/api/"
```

- **Releases atómicas (recomendado)**: copia a un directorio de release nuevo (`/srv/api/releases/<sha>`)
  y cambia un symlink `current` al final; así el cambio es atómico y el **rollback** es reapuntar el
  symlink a la release anterior. Si no aplicas releases atómicas, asume una ventana breve de
  indisponibilidad al recargar.

## 6. Ejecutar el despliegue remoto y recargar servicios

- Lanza los comandos remotos por SSH de forma **no interactiva**. En el host: instala dependencias de
  producción del backend, aplica migraciones si procede (skill `mongodb-migrations`) y **recarga** los
  servicios.

```yaml
run: |
  ssh -i key.pem "$SSH_USER@$SSH_HOST" 'bash -euo pipefail -s' <<'EOF'
    cd /srv/api
    npm ci --omit=dev
    sudo systemctl restart api
    sudo systemctl reload nginx
EOF
```

- Usa `set -euo pipefail` en el script remoto para que un fallo aborte el despliegue (no dejes el
  host a medias). La API NestJS debe apagar de forma ordenada ante `SIGTERM` (graceful shutdown, ver
  `nestjs-architecture.md` §6) para no perder peticiones al recargar.
- **No** metas secretos de aplicación (URI de Mongo, JWT) en el comando: viven en el host
  (`.env`/systemd `EnvironmentFile`/secret manager), no en el workflow.

## 7. Verificación post-despliegue y rollback

- Tras recargar, **verifica** que la app responde antes de dar el despliegue por bueno: consulta el
  endpoint de salud del backend (`/health`, ver `nestjs-errors-and-observability.md` §4) y que Nginx
  sirve la SPA. Un despliegue que no verifica es un despliegue a ciegas.

```yaml
run: |
  ssh -i key.pem "$SSH_USER@$SSH_HOST" \
    'curl -fsS http://localhost:3000/health > /dev/null'
```

- Define el **rollback**: con releases atómicas, reapunta el symlink `current` a la release previa y
  recarga; documenta el procedimiento. Si el health check falla, el job debe **fallar** (no marcar
  verde un despliegue roto).
- **Limpieza**: elimina la clave temporal al terminar (`rm -f key.pem`) aunque el runner sea efímero.

## 8. Rotación y mínimo privilegio (continuo)

- **Rota** periódicamente la clave (nuevo key pair en AWS, actualiza la pública autorizada del
  usuario `deploy` y el secreto de GitHub); prefiere claves **ed25519**.
- El usuario `deploy` mantiene **mínimo privilegio** (solo sus rutas y el `sudo` acotado de §2). No
  reutilices la clave para otros fines ni la compartas entre entornos.
- **Auditoría**: registra los despliegues (quién dispara, qué SHA, cuándo) — el propio historial de
  GitHub Actions y el environment protegido dan trazabilidad.
