import os
from pathlib import Path
import dj_database_url
from django.core.exceptions import ImproperlyConfigured

def database_config(base_dir: Path, debug: bool, environment=None):
    env = os.environ if environment is None else environment
    url = env.get("DATABASE_URL", "")
    if not url:
        if not debug:
            raise ImproperlyConfigured("Set DATABASE_URL to the MySQL or PostgreSQL connection URL.")
        return {"ENGINE": "django.db.backends.sqlite3", "NAME": base_dir / "db.sqlite3"}
    try:
        config = dj_database_url.parse(url, conn_max_age=60, conn_health_checks=True)
    except (ValueError, TypeError):
        raise ImproperlyConfigured("DATABASE_URL is invalid. Check its format privately in your environment settings.") from None
    engine = config["ENGINE"]
    if not debug and engine not in ["django.db.backends.mysql", "django.db.backends.postgresql"]:
        raise ImproperlyConfigured("Production requires MySQL or PostgreSQL; SQLite is for local development only.")
    if engine == "django.db.backends.mysql":
        options = config.setdefault("OPTIONS", {})
        options["charset"] = "utf8mb4"
        options["init_command"] = "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'"
        options["isolation_level"] = "read committed"
        if env.get("MYSQL_SSL_CA"):
            options["ssl"] = {"ca": env["MYSQL_SSL_CA"]}
            options["ssl_mode"] = "VERIFY_IDENTITY"
    return config
