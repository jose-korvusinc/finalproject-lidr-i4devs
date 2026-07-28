# Configuración del host EC2 (Ubuntu) — despliegue build-and-copy + Nginx

Ficheros de host **versionados** para el servidor EC2 donde se despliega la app (frontend Angular +
backend NestJS) según `.claude/rules/aws-ec2-ssh-deployment.md`. Topología: Nginx sirve la SPA y hace
de reverse proxy a la API; MongoDB corre en el mismo host vía docker-compose; la API corre como
servicio systemd bajo el usuario `deploy`. Node se gestiona con **nvm** (por decisión del proyecto).

## Ficheros y destino en el host

| Fichero (repo) | Destino en el EC2 | Notas |
| :--- | :--- | :--- |
| `api.service` | `/etc/systemd/system/api.service` | Unidad systemd de la API (nvm-aware, ver abajo). |
| `nginx-app.conf` | `/etc/nginx/sites-available/app` (symlink en `sites-enabled/`) | Vhost HTTP para `jpasoftware.com` y `*.jpasoftware.com`. Uso en el arranque inicial (antes de tener certificado). |
| `nginx-app-tls.conf` | `/etc/nginx/sites-available/app` (reemplaza al anterior) | Vhost de producción con HTTPS + redirect 80→443. Aplícalo **tras** emitir el certificado. |
| `sudoers-deploy` | `/etc/sudoers.d/deploy` | Permite a `deploy` recargar servicios sin password (acotado). |

## Node con nvm + systemd (importante)

`nvm` instala Node **por usuario** (`/home/deploy/.nvm`), así que el servicio **no** puede usar
`/usr/bin/node`. La unidad `api.service` arranca la API con **`nvm-exec`**, que resuelve la versión
indicada en `NODE_VERSION` desde el nvm del usuario `deploy`:

```ini
Environment=NODE_VERSION=22
ExecStart=/home/deploy/.nvm/nvm-exec node /srv/api/dist/main.js
```

Requisitos: `deploy` tiene nvm instalado y una versión 22.x (`nvm install 22`). Si cambias el major,
actualiza `NODE_VERSION`. El pipeline, al ejecutar `npm ci --omit=dev` en el host, debe cargar nvm
antes (`export NVM_DIR=/home/deploy/.nvm; . "$NVM_DIR/nvm.sh"; nvm use 22`).

## Aplicar (una vez, o al actualizar estos ficheros)

```bash
# API (systemd)
sudo cp api.service /etc/systemd/system/api.service
sudo systemctl daemon-reload
sudo systemctl enable api

# Nginx
sudo cp nginx-app.conf /etc/nginx/sites-available/app
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# sudoers
sudo cp sudoers-deploy /etc/sudoers.d/deploy
sudo chmod 440 /etc/sudoers.d/deploy
sudo visudo -c
```

## Rutas de despliegue (las rellena el pipeline)

- `/var/www/app` — build de la SPA (`code/frontend/dist/frontend/browser/`), servido por Nginx.
- `/srv/api` — `dist/` del backend + `package.json`/`package-lock.json`; `npm ci --omit=dev` aquí.
- `/etc/bookings-api/api.env` — variables de la API (renderizadas desde secretos del environment
  `production`), leídas por systemd (`EnvironmentFile`).

## HTTPS (certbot, wildcard)

El dominio es multitenant por subdominio, así que el certificado es **wildcard**
(`jpasoftware.com` + `*.jpasoftware.com`), que **solo** se emite con desafío **DNS-01**:

```bash
sudo snap install --classic certbot && sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot certonly --manual --preferred-challenges dns \
  --agree-tos -m <TU_EMAIL> \
  -d jpasoftware.com -d '*.jpasoftware.com'
# crea el/los TXT _acme-challenge.jpasoftware.com en el DNS y verifica con dig antes de continuar
```

Tras emitirlo, aplica `nginx-app-tls.conf` (reemplaza a `nginx-app.conf`) y `sudo nginx -t && sudo
systemctl reload nginx`. Abre **443** en el security group.

### Renovación manual (proveedor DNS externo)

Con `--manual` sin hook, la renovación es interactiva (vuelve a pedir el TXT):

```bash
sudo certbot renew --manual
# si `renew` no acepta el modo manual desatendido, reemite con el comando completo:
sudo certbot certonly --manual --preferred-challenges dns \
  -d jpasoftware.com -d '*.jpasoftware.com'
```

### Alternativa recomendada: DNS en Route 53 (renovación desatendida)

Si migras la zona de `jpasoftware.com` a Route 53, certbot automatiza el TXT y la renovación:

```bash
# plugin
sudo snap set certbot trust-plugin-with-root=ok
sudo snap install certbot-dns-route53

# emisión (usa credenciales AWS del rol de instancia o ~/.aws/credentials)
sudo certbot certonly --dns-route53 \
  -d jpasoftware.com -d '*.jpasoftware.com'

# la renovación queda desatendida por el timer de snap; prueba con:
sudo certbot renew --dry-run
```

Permisos IAM mínimos para el plugin (rol de la instancia EC2, `<ZONE_ID>` = zona de Route 53):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["route53:ListHostedZones", "route53:GetChange"], "Resource": "*" },
    { "Effect": "Allow", "Action": "route53:ChangeResourceRecordSets", "Resource": "arn:aws:route53:::hostedzone/<ZONE_ID>" }
  ]
}
```

## Notas de seguridad

- El servicio corre como `deploy` (mínimo privilegio), no como root; `sudoers` limitado a
  `systemctl restart api` / `reload nginx`.
- MongoDB debe mapear el puerto **solo a localhost** (`127.0.0.1:27017:27017`) para no exponerlo.
