# TakeOps

[English](README.md)

TakeOps é um app web self-hosted para equipes pequenas que produzem vídeos curtos (Reels, TikTok, YouTube Shorts). Ele cobre o fluxo inteiro, da ideia à publicação:

- caixa de ideias e pipeline de produções num quadro de tiras por etapa;
- roteiro, cenas e planos;
- planejamento da gravação com equipamentos e checklist;
- **Modo Gravação**, pensado para o celular, para registrar takes no set;
- notas de continuidade e links de arquivos;
- edição, versões, comentários de revisão e aprovação;
- registro de publicação e calendário compartilhado;
- avisos internos e histórico de atividade por produção.

O TakeOps organiza o processo. Ele não guarda mídia, não edita vídeo e não publica nas redes. Arquivos e versões são links para onde os arquivos já estão, e publicações são registradas, não executadas.

A interface está disponível em português do Brasil e inglês.

## Telas

Workspace de exemplo do `npm run db:seed` (dados fictícios).

![Produções no quadro de tiras, agrupadas por etapa](docs/screenshots/producoes.png)

![Dashboard com gravações próximas, revisão e produções em andamento](docs/screenshots/dashboard.png)

![Cenas e planos de uma produção](docs/screenshots/cenas.png)

<img src="docs/screenshots/modo-gravacao.png" alt="Modo Gravação no celular" width="320">

![Produções no tema escuro](docs/screenshots/producoes-escuro.png)

## Requisitos

- Docker com Compose (recomendado), **ou** Node.js 22+ e PostgreSQL 15+;
- um domínio com HTTPS em produção (OAuth e links por e-mail precisam de URL pública);
- ao menos um método de login: cliente OAuth do Google ou servidor SMTP para login por link.

## Início rápido com Docker Compose

```bash
git clone https://github.com/dennerstorres/takeops.git
cd takeops
cp .env.example .env
```

Edite o `.env` e defina pelo menos:

- `AUTH_SECRET`: 32+ caracteres (`openssl rand -base64 32`);
- `POSTGRES_PASSWORD`: só letras e números, porque vai dentro da URL do banco (`openssl rand -hex 24`);
- `AUTH_URL`: a URL pública, ex.: `https://takeops.exemplo.com`;
- um método de login (veja [Google OAuth](#google-oauth) e [Login por e-mail](#login-por-e-mail-smtp)).

Depois:

```bash
docker compose up -d --build
```

O compose sobe três serviços:

- `db`: PostgreSQL 17, com os dados no volume `db-data`;
- `app`: o TakeOps na porta `3000` (mude com `APP_PORT`). Ele aplica as migrations do banco a cada subida;
- `cron`: chama a rota de aviso de gravação próxima de hora em hora. Não faz nada enquanto `CRON_SECRET` não estiver definida.

Coloque um proxy reverso com HTTPS (Caddy, Traefik, nginx) na frente da porta 3000. A primeira pessoa que entrar cria o workspace e convida o resto da equipe.

## Deploy no Coolify

1. Crie um recurso PostgreSQL e copie a URL de conexão interna.
2. Crie uma aplicação a partir deste repositório Git, com build pack **Dockerfile** e porta `3000`.
3. Defina as variáveis de ambiente (veja a [tabela abaixo](#variáveis-de-ambiente)), incluindo o `DATABASE_URL` do passo 1.
4. Configure o domínio. O healthcheck do contêiner usa `/api/health`.
5. Opcional: para enviar o aviso de gravação próxima, defina `CRON_SECRET` e crie uma Scheduled Task na aplicação rodando de hora em hora (`0 * * * *`):

   ```bash
   node -e "fetch('http://127.0.0.1:3000/api/cron/upcoming-shoots',{method:'POST',headers:{authorization:'Bearer '+process.env.CRON_SECRET}}).then(r=>process.exit(r.ok?0:1))"
   ```

As migrations rodam quando o contêiner sobe. Use `MIGRATE_ON_START=false` se preferir rodar por fora.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim (o compose ignora) | URL do PostgreSQL, `postgresql://…` |
| `AUTH_SECRET` | sim em produção | Segredo das sessões, 32+ caracteres |
| `AUTH_URL` | recomendada | URL pública do app |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | um método de login | Cliente OAuth do Google |
| `EMAIL_SERVER` / `EMAIL_FROM` | um método de login | URL SMTP e remetente do link de login |
| `CRON_SECRET` | não | Liga `POST /api/cron/upcoming-shoots` (32+ caracteres) |
| `MIGRATE_ON_START` | não | `false` pula o `prisma migrate deploy` na subida (padrão `true`) |
| `POSTGRES_PASSWORD` | só no compose | Senha do PostgreSQL do compose |
| `APP_PORT` | só no compose | Porta no host (padrão `3000`) |

O app valida essas variáveis ao subir e não inicia com configuração inválida. A mensagem de erro cita o nome da variável, nunca o valor. Cada método de login só liga com as duas variáveis dele preenchidas.

## Google OAuth

No Google Cloud Console → APIs e serviços → Credenciais, crie um **ID do cliente OAuth** do tipo *Aplicativo da Web*:

- Origem JavaScript autorizada: `https://takeops.exemplo.com`
- URI de redirecionamento autorizado: `https://takeops.exemplo.com/api/auth/callback/google`

Copie o ID e a chave secreta do cliente para `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`.

## Login por e-mail (SMTP)

```env
EMAIL_SERVER="smtps://usuario:senha@smtp.exemplo.com:465"
EMAIL_FROM="TakeOps <takeops@exemplo.com>"
```

Use `smtps://` na porta 465 (TLS direto) ou `smtp://` na 587 (STARTTLS). Caracteres especiais da senha precisam ser codificados para URL.

**Servidor de e-mail próprio em Docker?** Se o e-mail de login ficar parado na fila com um erro como *DANE validation failed*, provavelmente o servidor de e-mail está resolvendo DNS pelo resolvedor do Docker, que não valida DNSSEC. Aponte o servidor de e-mail para um resolvedor que valide DNSSEC (por exemplo `1.1.1.1` ou `9.9.9.9`), em vez de afrouxar a política de TLS.

## Backup

Com o compose, gere o dump do banco:

```bash
docker compose exec -T db pg_dump -U takeops -Fc takeops > takeops-$(date +%F).dump
```

Para restaurar num banco vazio:

```bash
docker compose exec -T db pg_restore -U takeops -d takeops --clean --if-exists < takeops-2026-01-01.dump
```

No Coolify, ligue o backup agendado no recurso PostgreSQL, de preferência para um storage compatível com S3. O TakeOps não guarda mídia, então só o banco precisa de backup.

## Atualização

```bash
git pull
docker compose up -d --build
```

As migrations pendentes são aplicadas quando o app sobe. Faça um backup antes de atualizar. No Coolify, basta fazer o redeploy da aplicação.

## Desenvolvimento

```bash
npm install
cp .env.example .env        # aponte DATABASE_URL para um PostgreSQL local
npx prisma migrate deploy
npm run dev
```

`npx prisma dev --name takeops` sobe um PostgreSQL local e mostra a URL. `npm run verify` roda lint, checagem de contraste, typecheck, testes e build.

Veja o [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de abrir um pull request e o [`SECURITY.md`](SECURITY.md) para reportar vulnerabilidades. Quem for contribuir (pessoa ou agente de código) deve ler antes o [`HARNESS.md`](HARNESS.md) e o [`AGENTS.md`](AGENTS.md). A documentação do projeto (spec, plano, decisões) está em português.

Stack: Next.js, React, Prisma, PostgreSQL, Auth.js, next-intl, Tailwind CSS.

## Licença

[AGPL-3.0](LICENSE). Você pode usar e hospedar o TakeOps livremente. Se oferecer uma versão modificada como serviço em rede, precisa publicar o código-fonte.
