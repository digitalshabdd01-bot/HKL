#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python manage.py collectstatic --noinput
python manage.py migrate --noinput
if [[ "${HKL_IMPORT_CONTENT:-false}" == "true" ]]; then
  python manage.py import_hkl
  python manage.py import_collections
fi
if [[ "${HKL_BOOTSTRAP_ADMIN:-false}" == "true" ]]; then
  python manage.py bootstrap_admin
fi
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2 --access-logfile -
