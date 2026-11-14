# HKL MySQL setup

The backend supports MySQL using Django's MySQL backend and `mysqlclient`. No remote database is created by committing these files. Existing PostgreSQL and local SQLite development configurations remain supported.

## Local database

Set strong `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` environment variables privately. From the repository root, run:

```bash
docker compose -f backend/compose.mysql.yaml up -d
```

This creates the `hkl` database and `hkl_app` user in MySQL 8.4, bound to localhost only. Data persists in a named Docker volume. Do not remove that volume unless you intend to delete the database. Port 3306 must be available; change the host port if another MySQL instance already uses it.

Install the backend MySQL dependencies (`pip install -r backend/requirements-mysql.txt`). Linux may require `build-essential`, `pkg-config` and the MySQL client development libraries. The supplied backend Dockerfile installs these automatically.

Set `DATABASE_URL` privately in the backend environment:

```text
mysql://hkl_app:URL_ENCODED_PASSWORD@127.0.0.1:3306/hkl
```

Percent-encode special characters in the username/password. Never commit or send the real URL in chat. Settings use `utf8mb4` for Punjabi and other languages, strict SQL mode and read-committed transaction isolation. For an external MySQL provider, configure TLS using its instructions; `MYSQL_SSL_CA` can point to a mounted CA certificate, enabling identity verification. Do not disable certificate checks.

From `backend/`, run `python manage.py migrate` to create the Django/HKL tables, then run `python manage.py createsuperuser`. Optional commands `import_hkl` and `import_collections` populate reviewable drafts. The API code and frontend API URL do not change when switching database engines.

## Render backend connected to MySQL

Use Docker runtime with Dockerfile `backend/Dockerfile.mysql` and Docker build context `.` (repository root). Leave Root Directory blank. The container installs the MySQL driver and runs migrations at startup, once the database is reachable. Keep the existing settings from `DEPLOYMENT.md`, but supply the MySQL `DATABASE_URL`. Set `PORT` only if needed; Render normally supplies it.

Render does not provide a free managed MySQL resource. A MySQL server on Render requires a paid private service and a persistent disk mounted at `/var/lib/mysql`. Alternatively, use an existing MySQL host that permits a secure connection from Render. Database hosting, remote access/firewall rules and credentials must be configured before deployment. No paid service is provisioned automatically here.

Optional `HKL_IMPORT_CONTENT=true` imports drafts on startup without overwriting editor changes. Optional first-admin setup is documented in `DEPLOYMENT.md`; no admin account is created by default. The Docker entrypoint uses `exec` so Gunicorn receives shutdown signals.

Existing data is not automatically copied between PostgreSQL, SQLite and MySQL. Back up and plan a data migration before switching an already-used production database. The automated configuration tests run without connecting to a MySQL server; verify real migrations and API behavior on the chosen MySQL host before activating the frontend.
