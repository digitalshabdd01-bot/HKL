from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from .models import Content, Submission

@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"], STORAGES={"default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}, "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}})
class BackendTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = APIClient()
        self.live = Content.objects.create(kind="practice", slug="live", title="Live practice", published=True)
        self.draft = Content.objects.create(kind="practice", slug="draft", title="Draft practice")
        self.future = Content.objects.create(kind="talk", slug="future", title="Scheduled talk", published=True, publish_at=timezone.now() + timedelta(days=1))

    def test_public_api_only_returns_published_due_content(self):
        response = self.api.get("/api/v1/content/?kind=practice")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([x["id"] for x in response.json()["results"]], [self.live.id])
        for item in [self.draft, self.future]:
            self.assertEqual(self.api.get(f"/api/v1/content/{item.id}/").status_code, 404)

    def test_content_writes_are_not_public(self):
        self.assertEqual(self.api.post("/api/v1/content/", {"title": "Attack"}).status_code, 405)
        self.assertEqual(self.api.delete(f"/api/v1/content/{self.live.id}/").status_code, 405)

    def test_search_and_language(self):
        Content.objects.create(kind="practice", slug="live", language="es", title="Práctica", published=True)
        self.assertEqual(self.api.get("/api/v1/content/?language=es").json()["count"], 1)
        self.assertEqual(self.api.get("/api/v1/content/?search=nonexistent").json()["count"], 0)
        self.assertEqual(self.api.get("/api/v1/content/?kind=practice&slug=live").json()["count"], 1)
        self.assertEqual(self.api.get("/api/v1/content/?slug=draft").json()["count"], 0)

    def test_submission_validation_and_privacy(self):
        payload = {"name": "Example", "email": "person@example.com", "message": "Please contact me", "consent": True, "status": "closed"}
        response = self.api.post("/api/v1/contact/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("email", response.json())
        self.assertEqual(Submission.objects.get().status, "new")
        self.assertEqual(self.api.get("/api/v1/contact/").status_code, 405)
        payload["consent"] = False
        self.assertEqual(self.api.post("/api/v1/volunteer/", payload, format="json").status_code, 400)
        payload["consent"] = True
        payload["email"] = "invalid"
        self.assertEqual(self.api.post("/api/v1/contact/", payload, format="json").status_code, 400)

    def test_submission_throttle(self):
        payload = {"name": "Example", "email": "person@example.com", "message": "Hello", "consent": True}
        for _ in range(5):
            self.assertEqual(self.api.post("/api/v1/contact/", payload, format="json").status_code, 201)
        self.assertEqual(self.api.post("/api/v1/contact/", payload, format="json").status_code, 429)

    def test_admin_requires_staff_and_csrf(self):
        self.assertEqual(self.api.get("/admin/cms/content/").status_code, 302)
        user = get_user_model().objects.create_user(username="reader", password="test-password-only")
        self.api.force_login(user)
        self.assertEqual(self.api.get("/admin/cms/content/").status_code, 302)
        user.is_staff = user.is_superuser = True
        user.save()
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(user)
        self.assertEqual(client.get("/admin/cms/content/").status_code, 200)
        self.assertEqual(client.post("/admin/cms/content/add/", {}).status_code, 403)

    def test_event_dates(self):
        item = Content(kind="event", slug="bad", title="Invalid", starts_at=timezone.now(), ends_at=timezone.now() - timedelta(days=1))
        with self.assertRaises(ValidationError):
            item.full_clean()

    def test_health(self):
        self.assertEqual(self.api.get("/health/").json(), {"status": "ok"})

    def test_bootstrap_creates_first_admin_and_never_resets_it(self):
        from io import StringIO
        from unittest.mock import patch
        from django.core.management import call_command
        values = {"DJANGO_SUPERUSER_USERNAME": "initial-admin", "DJANGO_SUPERUSER_EMAIL": "admin@example.com", "DJANGO_SUPERUSER_PASSWORD": "Example-Only-Long-Password-7284"}
        output = StringIO()
        with patch.dict("os.environ", values):
            call_command("bootstrap_admin", stdout=output)
            admin = get_user_model().objects.get(username="initial-admin")
            self.assertTrue(admin.is_staff and admin.is_superuser)
            self.assertTrue(admin.check_password(values["DJANGO_SUPERUSER_PASSWORD"]))
            original_hash = admin.password
            call_command("bootstrap_admin", stdout=output)
            admin.refresh_from_db()
            self.assertEqual(admin.password, original_hash)
            self.assertEqual(get_user_model().objects.count(), 1)
        self.assertNotIn(values["DJANGO_SUPERUSER_PASSWORD"], output.getvalue())

    def test_bootstrap_rejects_invalid_details_without_printing_them(self):
        from unittest.mock import patch
        from django.core.management import call_command, CommandError
        values = {"DJANGO_SUPERUSER_USERNAME": "initial-admin", "DJANGO_SUPERUSER_EMAIL": "invalid-email", "DJANGO_SUPERUSER_PASSWORD": "short"}
        with patch.dict("os.environ", values):
            with self.assertRaises(CommandError) as error:
                call_command("bootstrap_admin")
        self.assertNotIn("invalid-email", str(error.exception))
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_bootstrap_never_promotes_an_existing_username(self):
        from unittest.mock import patch
        from django.core.management import call_command, CommandError
        user = get_user_model().objects.create_user(username="reserved")
        with patch.dict("os.environ", {"DJANGO_SUPERUSER_USERNAME": "reserved", "DJANGO_SUPERUSER_EMAIL": "admin@example.com", "DJANGO_SUPERUSER_PASSWORD": "Example-Only-Long-Password-7284"}):
            with self.assertRaises(CommandError):
                call_command("bootstrap_admin")
        user.refresh_from_db()
        self.assertFalse(user.is_staff or user.is_superuser)

    def test_event_windows_and_types(self):
        now = timezone.now()
        past = Content.objects.create(kind="event", slug="past", title="Past conference", published=True, starts_at=now-timedelta(days=3), ends_at=now-timedelta(days=2))
        current = Content.objects.create(kind="event", slug="current", title="In progress", published=True, starts_at=now-timedelta(days=1), ends_at=now+timedelta(days=1))
        walk = Content.objects.create(kind="event", slug="walk", title="Walk", event_type="walk", published=True, starts_at=now+timedelta(days=3))
        upcoming = self.api.get("/api/v1/content/?kind=event&event_window=upcoming&event_type=conference").json()["results"]
        self.assertEqual([x["id"] for x in upcoming], [current.id])
        archived = self.api.get("/api/v1/content/?kind=event&event_window=past").json()["results"]
        self.assertEqual([x["id"] for x in archived], [past.id])
        self.assertEqual(self.api.get("/api/v1/content/?kind=event&event_type=walk").json()["results"][0]["id"], walk.id)

    def test_draft_speakers_are_not_exposed_through_events(self):
        event = Content.objects.create(kind="event", slug="conference", title="Conference", published=True)
        event.speakers.add(self.draft)
        speaker = Content.objects.create(kind="speaker", slug="speaker", title="Speaker", published=True)
        hidden = Content.objects.create(kind="speaker", slug="hidden", title="Hidden")
        event.speakers.add(speaker, hidden)
        data = self.api.get(f"/api/v1/content/{event.id}/").json()
        self.assertEqual([person["id"] for person in data["speakers"]], [speaker.id])

    def test_settings_are_only_public_after_publication(self):
        from .models import SiteSettings
        self.assertEqual(self.api.get("/api/v1/settings/").status_code, 404)
        settings = SiteSettings.objects.create(homepage_title="Edited headline")
        self.assertEqual(self.api.get("/api/v1/settings/").status_code, 404)
        settings.published = True
        settings.save()
        response = self.api.get("/api/v1/settings/")
        self.assertEqual(response.json()["homepage_title"], "Edited headline")
        self.assertNotIn("published", response.json())
        self.assertEqual(self.api.post("/api/v1/settings/", {"homepage_title": "Attack"}).status_code, 405)

    def test_event_cannot_be_published_without_date(self):
        item = Content(kind="event", slug="undated", title="Undated", published=True)
        with self.assertRaises(ValidationError):
            item.full_clean()

    def test_import_preserves_practice_body_and_admin_edits(self):
        import json
        from io import StringIO
        from unittest.mock import patch
        from django.core.management import call_command
        fixture = {"practices": [{"slug": "imported", "title": "Imported practice", "body": "Keep this practice text."}], "talks": []}
        with patch("pathlib.Path.read_text", return_value=json.dumps(fixture)):
            call_command("import_hkl", stdout=StringIO())
            item = Content.objects.get(slug="imported")
            self.assertEqual(item.body, "Keep this practice text.")
            self.assertFalse(item.published)
            item.title = "Administrator edit"
            item.save()
            call_command("import_hkl", stdout=StringIO())
            item.refresh_from_db()
            self.assertEqual(item.title, "Administrator edit")
            self.assertEqual(Content.objects.filter(slug="imported").count(), 1)
