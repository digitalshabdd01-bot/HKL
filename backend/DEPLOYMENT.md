# Activate the HKL backend on Render

Use a separate Python web service from `digitalshabdd01-bot/HKL`, branch `main`. Leave **Root Directory blank** so that the `content/` catalogs remain available to the importer. Earlier instructions to use `backend` as the service root are superseded by this guide.

| Setting | Value |
|---|---|
| Build command | `bash backend/build.sh` |
| Start command | `gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --access-logfile -` |
| Health check | `/health/` |
| Python | `3.12.14` |

`backend/render.yaml` contains the equivalent service definition. The root `render.yaml` belongs to the existing frontend. Do not replace the frontend with the Python backend.

## Environment

Set these privately in Render, never in GitHub or chat:

* `DJANGO_SECRET_KEY`: generated random secret.
* `DATABASE_URL`: PostgreSQL connection string. Prefer the database's internal URL when both services are in the same Render region.
* `DJANGO_DEBUG=false` and `PYTHON_VERSION=3.12.14`.
* `FRONTEND_ORIGINS`: exact public frontend origin without a trailing slash.
* `CSRF_TRUSTED_ORIGINS`: exact backend HTTPS origin. `DJANGO_ALLOWED_HOSTS` may contain its hostname; Render's own hostname is also allowed automatically.

Database/service plan selection is separate from this code. Render's free database expires after 30 days; use it only for a temporary preview. An enduring deployment needs a suitable persistent database plan. No database is provisioned by this Blueprint.

## First deployment without shell access

Optionally set `HKL_IMPORT_CONTENT=true` to import repository content as drafts during the build. Imports preserve editor changes. Review the drafts and publish the content before connecting the frontend.

To create the **first** admin, set `HKL_BOOTSTRAP_ADMIN=true` and the private environment variables `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, and `DJANGO_SUPERUSER_PASSWORD`. Use a strong unique password. Build logs do not print these values. The command validates the details and creates a hashed password. If any superuser already exists, it makes no changes; it never promotes or resets an existing account. Remove the bootstrap flag and three credential variables after the first successful deployment. Staff subsequently use `/admin/` for login.

## Verify and connect

1. Confirm backend `/health/` returns `{"status":"ok"}` and `/admin/` loads.
2. Confirm imported content in admin, review dates/media, and publish the intended records.
3. Check `/api/v1/content/?kind=practice` returns the published library.
4. On the existing frontend service set `NEXT_PUBLIC_HKL_API_URL` to the backend origin without `/api/v1`, then rebuild the frontend.
5. Verify practice/talk lists, new detail links, conferences, publications, profiles and contact/volunteer submissions. Look for submissions in admin; email notifications are not implemented yet.

If the backend is not ready, leave `NEXT_PUBLIC_HKL_API_URL` unset so the current frontend content/email workflow remains available. Do not publish all drafts automatically to fill empty directories.
