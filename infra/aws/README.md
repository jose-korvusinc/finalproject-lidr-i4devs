# Infraestructura AWS — OIDC para GitHub Actions (despliegue a EC2)

Artefactos versionados del **alta única** en AWS que habilita el despliegue por GitHub Actions al
EC2 con **whitelisting dinámico del puerto 22** autenticado por **OIDC** (sin claves de acceso de
larga vida). Es el par AWS del pipeline descrito en las rules `.claude/rules/github-actions-*.md` y
`.claude/rules/aws-ec2-ssh-deployment.md` (§1.1), y de la skill `github-actions-ec2-deploy`.

## Ficheros

- `github-actions-trust-policy.json` — política de confianza del rol IAM. Acota quién puede asumir
  el rol a este repositorio y al environment `production` de GitHub
  (`repo:jose-korvusinc/finalproject-lidr-i4devs:environment:production`).
- `github-actions-sg-policy.json` — política de permisos (mínimo privilegio): describir security
  groups y abrir/revocar reglas de entrada **solo** en el security group del EC2.

> **Placeholder**: ambos ficheros usan `<ACCOUNT_ID>` en lugar del número de cuenta AWS real (12
> dígitos), que **no se commitea**. Sustitúyelo al aplicar. Valores concretos de este entorno:
> región `eu-west-1`, security group `sg-037918f573b8c95d7`.

## Valores del entorno

| Concepto | Valor |
| :--- | :--- |
| Región | `eu-west-1` |
| Security group | `sg-037918f573b8c95d7` |
| OIDC provider URL | `https://token.actions.githubusercontent.com` |
| OIDC audience | `sts.amazonaws.com` |
| Nombre del rol | `github-actions-ec2-deploy` |
| `sub` de confianza | `repo:jose-korvusinc/finalproject-lidr-i4devs:environment:production` |

## Pasos para reproducir el alta

Requiere una identidad AWS con permisos de IAM/EC2 y la región `eu-west-1`.

### 1. OIDC identity provider

Desde junio de 2023 **no se requiere thumbprint** (AWS confía en la CA raíz de GitHub); si la consola
no lo pide, es correcto.

```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com"
```

### 2. Rol IAM (confianza OIDC + permisos mínimos)

Sustituye `<ACCOUNT_ID>` en los dos JSON antes de aplicar.

```bash
aws iam create-role \
  --role-name github-actions-ec2-deploy \
  --assume-role-policy-document file://github-actions-trust-policy.json

aws iam put-role-policy \
  --role-name github-actions-ec2-deploy \
  --policy-name github-actions-sg-port22 \
  --policy-document file://github-actions-sg-policy.json
```

Resultado: `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-ec2-deploy`.

## Secretos que consume el workflow (environment `production` de GitHub)

Estos valores se cargan como secretos/variables del environment `production` del repositorio (no en
el código). El account ID real solo vive en AWS y en el secreto `AWS_ROLE_ARN`, no en este repo.

| Nombre | Origen |
| :--- | :--- |
| `AWS_ROLE_ARN` | `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-ec2-deploy` |
| `AWS_REGION` | `eu-west-1` |
| `AWS_SECURITY_GROUP_ID` | `sg-037918f573b8c95d7` |
| `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_KNOWN_HOSTS` | Acceso SSH al EC2 (ver `aws-ec2-ssh-deployment.md`) |
| `MONGODB_URI`, `MONGODB_DB` | Entorno de la app backend (se renderiza a `/etc/bookings-api/api.env` en el host) |

## Notas de seguridad

- La confianza del rol está atada al environment `production`: un job que **no** declare
  `environment: production` (o de otro repo) **no** puede asumir el rol.
- El rol solo puede tocar el security group `sg-037918f573b8c95d7`; el puerto 22 se abre a la IP del
  runner durante el despliegue y se revoca con `if: always()`.
- No se usan claves de acceso AWS de larga vida (solo OIDC). No commitees el account ID ni secretos.
