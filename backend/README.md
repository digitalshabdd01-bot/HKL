# HKL backend — phase 1

Django 5.2 LTS + Django REST Framework. Django admin provides staff login, logout, permissions, content editing and enquiry review. Production supports MySQL or PostgreSQL; SQLite is available for local development only. See [MYSQL.md](MYSQL.md) for MySQL dependencies, connection settings and Docker deployment. No default admin account or password is committed.

## Local setup

Run inside `backend/` (Windows uses `.venv\Scripts\activate`):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DJANGO_DEBUG=true
python manage.py migrate
python manage.py createsuperuser
python manage.py import_hkl
python manage.py runserver
```

PowerShell: use `$env:DJANGO_DEBUG="true"` instead of `export`. Settings read environment variables; copying `.env.example` alone does not load them.

Open `http://localhost:8000/admin/`. Import creates existing practices and talks as drafts for review. Running the import again never overwrites editor changes. Review media URLs, then publish records. Media uses durable HTTPS URLs in this phase; uploads/object storage are not yet implemented.

## API

| Endpoint | Method | Behavior |
|---|---|---|
| `/health/` | GET | Database connectivity check |
| `/api/v1/content/` | GET | Paginated published content only |
| `/api/v1/content/ID/` | GET | Published record; draft/future content returns 404 |
| `/api/v1/contact/` | POST | Save validated private enquiry |
| `/api/v1/volunteer/` | POST | Save validated private application |

Content filters: `kind=practice|talk|event|publication|speaker|page`, `language=en`, `featured=true`, `search=...`, `page=2`.

Submission JSON: `name`, `email`, `message`, `consent: true`; optional `location`, `phone`, `interests`. Response contains a generic acknowledgement, not personal data. No public list of enquiries or volunteers exists. Editing is through permission-controlled Django admin with CSRF protection. Anonymous form submissions have a basic per-process throttle; use shared cache and edge rate limiting before running multiple production workers at scale.

## Render

Create a **separate Python web service** from this repository and leave Root Directory blank. Build: `bash backend/build.sh`. Start: `gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --access-logfile -`. Keeping the repository root makes the content catalogs available to import commands. Alternatively use `backend/render.yaml` as a separate Blueprint. This does not provision or purchase a database. See [DEPLOYMENT.md](DEPLOYMENT.md) for first-admin setup without shell access and activation steps.

Set `DJANGO_SECRET_KEY` to a generated random value, `DJANGO_DEBUG=false`, `DATABASE_URL` to a persistent PostgreSQL database, `DJANGO_ALLOWED_HOSTS` to the backend hostname, `FRONTEND_ORIGINS` to the exact frontend HTTPS origin, and `CSRF_TRUSTED_ORIGINS` to the backend HTTPS origin. The Render hostname is automatically allowed. Never commit real credentials. Run `python manage.py check --deploy` with production settings before rollout.

Create the first admin using `python manage.py createsuperuser` in a secure management environment with access to the production database. Free Render services may not offer a shell; a trusted local environment with the database's external connection is another option. Do not expose a public admin-registration endpoint.

## Verification and remaining work

```bash
DJANGO_DEBUG=true python manage.py test
DJANGO_DEBUG=true python manage.py makemigrations --check --dry-run
```

The existing frontend continues using its JSON content until API integration is completed. Next: connect frontend pages and forms, add durable media uploads, email notifications/subscription confirmation, settings and translations, and production login abuse protection. Newsletter campaigns, payment processing, polls and community accounts are not included in this phase. No email is sent by the current submission endpoints.
