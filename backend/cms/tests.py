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
