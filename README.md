# TakeOps

[Português](README.pt-BR.md)

TakeOps is a self-hosted web app for small teams that produce short videos (Reels, TikTok, YouTube Shorts). It covers the whole workflow, from idea to publication:

- ideas inbox and production pipeline on a stripboard grouped by stage;
- script, scenes and shots;
- shoot planning with equipment and checklists;
- **recording mode**, mobile-first, to log takes on set;
- continuity notes and external asset links;
- editing, versions, review comments and approval;
- publication tracking and a shared calendar;
- in-app notifications and activity log per production.

TakeOps manages the process. It doesn't store media or edit video, and it doesn't post to social networks: assets and edit versions are links to wherever your files already live, and publications are recorded, not executed.

The interface is available in English and Brazilian Portuguese.

## Screenshots

Sample workspace from `npm run db:seed` (fictional data, Portuguese UI).

![Productions on the stripboard, grouped by stage](docs/screenshots/producoes.png)

![Dashboard with upcoming shoots, review and productions in progress](docs/screenshots/dashboard.png)

![Scenes and shots of a production](docs/screenshots/cenas.png)

<img src="docs/screenshots/modo-gravacao.png" alt="Recording mode on a phone" width="320">

![Productions in dark theme](docs/screenshots/producoes-escuro.png)

## Requirements

- Docker with Compose (recommended), **or** Node.js 22+ and PostgreSQL 15+;
- a domain with HTTPS for production (OAuth and email links need a public URL);
- at least one login method: a Google OAuth client, or an SMTP server for email sign-in links.

## Quick start with Docker Compose

```bash
git clone https://github.com/dennerstorres/takeops.git
cd takeops
cp .env.example .env
```

Edit `.env` and set at least:

- `AUTH_SECRET`: 32+ characters (`openssl rand -base64 32`);
- `POSTGRES_PASSWORD`: letters and digits only, because it goes into the database URL (`openssl rand -hex 24`);
- `AUTH_URL`: the public URL, e.g. `https://takeops.example.com`;
- one login method (see [Google OAuth](#google-oauth) and [Email sign-in](#email-sign-in-smtp)).

Then:

```bash
docker compose up -d --build
```

Compose starts three services:

- `db`: PostgreSQL 17, with data kept in the `db-data` volume;
- `app`: TakeOps on port `3000` (change it with `APP_PORT`). It applies database migrations on every start;
- `cron`: calls the upcoming-shoot reminder route once an hour. It does nothing until `CRON_SECRET` is set.

Put a reverse proxy with HTTPS (Caddy, Traefik, nginx) in front of port 3000. The first person to sign in creates the first workspace and invites the rest of the team.

## Deploying with Coolify

1. Create a PostgreSQL resource and copy its internal connection URL.
2. Create an application from this Git repository with the **Dockerfile** build pack and port `3000`.
3. Set the environment variables (see the [table below](#environment-variables)), including `DATABASE_URL` from step 1.
4. Set the domain. The container healthcheck uses `/api/health`.
5. Optional: to send upcoming-shoot reminders, set `CRON_SECRET` and add a Scheduled Task on the app that runs every hour (`0 * * * *`):

   ```bash
   node -e "fetch('http://127.0.0.1:3000/api/cron/upcoming-shoots',{method:'POST',headers:{authorization:'Bearer '+process.env.CRON_SECRET}}).then(r=>process.exit(r.ok?0:1))"
   ```

Migrations run when the container starts. Set `MIGRATE_ON_START=false` if you prefer to run them yourself.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes (ignored by Compose) | PostgreSQL URL, `postgresql://…` |
| `AUTH_SECRET` | yes in production | Session secret, 32+ characters |
| `AUTH_URL` | recommended | Public URL of the app |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | one login method | Google OAuth client |
| `EMAIL_SERVER` / `EMAIL_FROM` | one login method | SMTP URL and sender for sign-in links |
| `CRON_SECRET` | no | Enables `POST /api/cron/upcoming-shoots` (32+ characters) |
| `MIGRATE_ON_START` | no | `false` skips `prisma migrate deploy` on start (default `true`) |
| `POSTGRES_PASSWORD` | Compose only | Password of the bundled PostgreSQL |
| `APP_PORT` | Compose only | Host port (default `3000`) |

The app validates these values on start and refuses to boot with an invalid configuration. The error names the variable, never its value. Each login method is enabled only when both of its variables are set.

## Google OAuth

In Google Cloud Console → APIs & Services → Credentials, create an **OAuth client ID** of type *Web application*:

- Authorized JavaScript origin: `https://takeops.example.com`
- Authorized redirect URI: `https://takeops.example.com/api/auth/callback/google`

Copy the client ID and secret to `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

## Email sign-in (SMTP)

```env
EMAIL_SERVER="smtps://user:password@smtp.example.com:465"
EMAIL_FROM="TakeOps <takeops@example.com>"
```

Use `smtps://` for port 465 (implicit TLS) or `smtp://` for 587 (STARTTLS). URL-encode special characters in the password.

**Running your own mail server in Docker?** If sign-in emails get stuck in the queue with an error like *DANE validation failed*, the mail server is probably resolving DNS through Docker's resolver, which doesn't validate DNSSEC. Point the mail server to a DNSSEC-validating resolver (for example `1.1.1.1` or `9.9.9.9`) instead of weakening its TLS policy.

## Backup

With Compose, dump the database:

```bash
docker compose exec -T db pg_dump -U takeops -Fc takeops > takeops-$(date +%F).dump
```

Restore into an empty database:

```bash
docker compose exec -T db pg_restore -U takeops -d takeops --clean --if-exists < takeops-2026-01-01.dump
```

On Coolify, enable scheduled backups on the PostgreSQL resource, ideally to S3-compatible storage. TakeOps stores no media, so the database is all you need to back up.

## Updating

```bash
git pull
docker compose up -d --build
```

Pending migrations are applied when the app starts. Take a backup before updating. On Coolify, redeploy the application.

## Development

```bash
npm install
cp .env.example .env        # point DATABASE_URL to a local PostgreSQL
npx prisma migrate deploy
npm run dev
```

`npx prisma dev --name takeops` starts a local PostgreSQL and prints its URL. `npm run verify` runs lint, contrast check, typecheck, tests and build.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request, and [`SECURITY.md`](SECURITY.md) to report vulnerabilities. Contributors (people and coding agents) should read [`HARNESS.md`](HARNESS.md) and [`AGENTS.md`](AGENTS.md) first. Project docs (spec, plan, decisions) are in Portuguese.

Stack: Next.js, React, Prisma, PostgreSQL, Auth.js, next-intl, Tailwind CSS.

## License

[AGPL-3.0](LICENSE). You can use and host TakeOps freely. If you offer a modified version as a network service, you must publish its source code.
