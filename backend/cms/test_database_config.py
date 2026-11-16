from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from config.database import database_config

class DatabaseConfigTests(SimpleTestCase):
    def test_mysql_uses_unicode_strict_mode_and_decodes_credentials(self):
        config = database_config(Path("/app"), False, {"DATABASE_URL": "mysql://hkl:example%40value@mysql.internal:3306/hkl"})
        self.assertEqual(config["ENGINE"], "django.db.backends.mysql")
        self.assertEqual(config["PASSWORD"], "example@value")
        self.assertEqual(config["OPTIONS"]["charset"], "utf8mb4")
        self.assertIn("STRICT_TRANS_TABLES", config["OPTIONS"]["init_command"])
        self.assertEqual(config["OPTIONS"]["isolation_level"], "read committed")

    def test_external_mysql_can_verify_tls_identity(self):
        config = database_config(Path("/app"), False, {"DATABASE_URL": "mysql://user:example@database.example/hkl", "MYSQL_SSL_CA": "/etc/secrets/ca.pem"})
        self.assertEqual(config["OPTIONS"]["ssl_mode"], "VERIFY_IDENTITY")
        self.assertEqual(config["OPTIONS"]["ssl"]["ca"], "/etc/secrets/ca.pem")

    def test_postgres_compatibility(self):
        config = database_config(Path("/app"), False, {"DATABASE_URL": "postgresql://user:example@db.internal/hkl"})
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")

    def test_pure_python_mysql_retains_strict_mode_and_credentials(self):
        config = database_config(Path("/app"), True, {
            "DATABASE_URL": "mysql://hkl:example%40value@127.0.0.1:3306/hkl",
            "MYSQL_DRIVER": "connector",
        })
        self.assertEqual(config["ENGINE"], "mysql.connector.django")
        self.assertIs(config["OPTIONS"]["use_pure"], True)
        self.assertEqual(config["PASSWORD"], "example@value")
        self.assertEqual(config["OPTIONS"]["charset"], "utf8mb4")
        self.assertIn("STRICT_TRANS_TABLES", config["OPTIONS"]["init_command"])
        self.assertEqual(config["OPTIONS"]["isolation_level"], "read committed")

    def test_pure_python_mysql_preserves_tls_identity_checks(self):
        config = database_config(Path("/app"), False, {
            "DATABASE_URL": "mysql://user:example@database.example/hkl",
            "MYSQL_DRIVER": "connector", "MYSQL_SSL_CA": "/etc/secrets/ca.pem",
        })
        self.assertEqual(config["OPTIONS"]["ssl_ca"], "/etc/secrets/ca.pem")
        self.assertIs(config["OPTIONS"]["ssl_verify_cert"], True)
        self.assertIs(config["OPTIONS"]["ssl_verify_identity"], True)
        self.assertNotIn("ssl_mode", config["OPTIONS"])
        self.assertNotIn("ssl", config["OPTIONS"])

    def test_unknown_mysql_driver_fails_without_echoing_credentials(self):
        with self.assertRaises(ImproperlyConfigured) as error:
            database_config(Path("/app"), True, {
                "DATABASE_URL": "mysql://user:private-example@host/hkl",
                "MYSQL_DRIVER": "unknown",
            })
        self.assertNotIn("private-example", str(error.exception))

    def test_local_sqlite_fallback_only_in_debug(self):
        self.assertEqual(database_config(Path("/app"), True, {})["ENGINE"], "django.db.backends.sqlite3")
        with self.assertRaises(ImproperlyConfigured):
            database_config(Path("/app"), False, {})

    def test_production_rejects_sqlite(self):
        with self.assertRaises(ImproperlyConfigured):
            database_config(Path("/app"), False, {"DATABASE_URL": "sqlite:///temporary.sqlite3"})

    def test_invalid_url_error_does_not_echo_credentials(self):
        with self.assertRaises(ImproperlyConfigured) as error:
            database_config(Path("/app"), False, {"DATABASE_URL": "unsupported://user:private-example@host/db"})
        self.assertNotIn("private-example", str(error.exception))
