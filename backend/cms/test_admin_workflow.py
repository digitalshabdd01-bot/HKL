from datetime import timedelta
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.admin.models import LogEntry
from django.test import TestCase, override_settings
from django.utils import timezone
from .models import Content, Submission

@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"], STORAGES={"default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}, "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}})
class AdminWorkflowTests(TestCase):
    def setUp(self):
        self.editor = get_user_model().objects.create_superuser(username="editor", email="editor@example.com", password="Example-test-password-29483")
        self.client.force_login(self.editor)
        self.draft = Content.objects.create(kind="practice", slug="draft", title="Practice")

    def action(self, action, records, model="content"):
        return self.client.post(f"/admin/cms/{model}/", {"action": action, "_selected_action": [record.pk for record in records], "index": 0})

    def test_publish_records_actor_and_admin_history(self):
        self.assertEqual(self.action("publish_selected", [self.draft]).status_code, 302)
        self.draft.refresh_from_db()
        self.assertTrue(self.draft.published)
        self.assertEqual(self.draft.last_edited_by, self.editor)
        self.assertEqual(self.draft.published_by, self.editor)
        self.assertEqual(LogEntry.objects.filter(object_id=str(self.draft.pk), user=self.editor).count(), 1)

    def test_invalid_event_blocks_entire_bulk_publication(self):
        event = Content.objects.create(kind="event", slug="undated", title="Missing date")
        self.action("publish_selected", [self.draft, event])
        self.draft.refresh_from_db()
        event.refresh_from_db()
        self.assertFalse(self.draft.published)
        self.assertFalse(event.published)
        self.assertEqual(LogEntry.objects.count(), 0)

    def test_future_publication_remains_scheduled(self):
        self.draft.publish_at = timezone.now() + timedelta(days=3)
        self.draft.save()
        self.action("publish_selected", [self.draft])
        self.draft.refresh_from_db()
        self.assertTrue(self.draft.published)
        self.assertEqual(self.client.get(f"/api/v1/content/{self.draft.pk}/").status_code, 404)

    def test_unpublish_hides_content_without_deleting_it(self):
        self.action("publish_selected", [self.draft])
        self.action("unpublish_selected", [self.draft])
        self.draft.refresh_from_db()
        self.assertFalse(self.draft.published)
        self.assertEqual(self.draft.published_by, self.editor)
        self.assertEqual(self.client.get(f"/api/v1/content/{self.draft.pk}/").status_code, 404)

    def test_readonly_staff_cannot_publish(self):
        viewer = get_user_model().objects.create_user(username="viewer", is_staff=True)
        viewer.user_permissions.add(Permission.objects.get(codename="view_content", content_type__app_label="cms"))
        self.client.force_login(viewer)
        self.action("publish_selected", [self.draft])
        self.draft.refresh_from_db()
        self.assertFalse(self.draft.published)

    def test_review_close_and_reopen_preserve_original_submission(self):
        item = Submission.objects.create(kind="contact", name="Example", email="person@example.com", message="Original message", consent=True)
        for action, expected in [("mark_reviewed", "reviewed"), ("mark_closed", "closed"), ("reopen", "new")]:
            self.assertEqual(self.action(action, [item], "submission").status_code, 302)
            item.refresh_from_db()
            self.assertEqual(item.status, expected)
            self.assertEqual(item.reviewed_by, self.editor)
            self.assertIsNotNone(item.reviewed_at)
            self.assertEqual(item.message, "Original message")
            self.assertTrue(item.consent)

    def test_readonly_staff_cannot_change_enquiry_status(self):
        item = Submission.objects.create(kind="contact", name="Example", email="person@example.com", message="Original", consent=True)
        viewer = get_user_model().objects.create_user(username="reviewer", is_staff=True)
        viewer.user_permissions.add(Permission.objects.get(codename="view_submission", content_type__app_label="cms"))
        self.client.force_login(viewer)
        self.action("mark_closed", [item], "submission")
        item.refresh_from_db()
        self.assertEqual(item.status, "new")

    def test_public_content_does_not_expose_staff_identity(self):
        self.action("publish_selected", [self.draft])
        response = self.client.get(f"/api/v1/content/{self.draft.pk}/").json()
        self.assertNotIn("last_edited_by", response)
        self.assertNotIn("published_by", response)

    def test_edit_records_editor_without_changing_last_publisher(self):
        from django.contrib import admin
        from django.test import RequestFactory
        from .admin import ContentAdmin
        self.action("publish_selected", [self.draft])
        self.draft.refresh_from_db()
        other = get_user_model().objects.create_superuser(username="other", email="other@example.com", password="Example-test-password-92838")
        request = RequestFactory().post("/admin/")
        request.user = other
        self.draft.title = "Updated title"
        ContentAdmin(Content, admin.site).save_model(request, self.draft, None, True)
        self.draft.refresh_from_db()
        self.assertEqual(self.draft.last_edited_by, other)
        self.assertEqual(self.draft.published_by, self.editor)
