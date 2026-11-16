from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone
from .models import Content, Submission, SiteSettings

@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "language", "published", "featured", "publish_at"]
    list_filter = ["kind", "language", "published", "featured", "event_type", "profile_role"]
    search_fields = ["title", "summary", "body"]
    prepopulated_fields = {"slug": ["title"]}
    readonly_fields = ["created_at", "updated_at", "last_edited_by", "published_by"]
    filter_horizontal = ["speakers"]
    actions = ["publish_selected", "unpublish_selected"]
    list_select_related = ["last_edited_by", "published_by"]
    fieldsets = [
        ("Content", {"fields": ["kind", "title", "slug", "language", "summary", "body"]}),
        ("Publishing", {"fields": ["published", "publish_at", "featured", "sort_order"], "description": "A future publish time schedules visibility. Drafts stay private."}),
        ("Images, videos and reading links", {"fields": ["image_url", "video_url", "resource_url"], "classes": ["collapse"]}),
        ("Events", {"fields": ["event_type", "starts_at", "ends_at", "location", "country", "registration_url", "speakers"], "classes": ["collapse"]}),
        ("Episode, issue and profile details", {"fields": ["episode", "issue_number", "profile_role"], "classes": ["collapse"]}),
        ("Edit history", {"fields": ["created_at", "updated_at", "last_edited_by", "published_by"], "classes": ["collapse"]}),
    ]

    def save_model(self, request, obj, form, change):
        previously_published = Content.objects.filter(pk=obj.pk, published=True).exists() if change else False
        obj.last_edited_by = request.user
        if obj.published and not previously_published:
            obj.published_by = request.user
        super().save_model(request, obj, form, change)

    def _set_publication(self, request, queryset, published):
        if not self.has_change_permission(request):
            raise PermissionDenied
        try:
            with transaction.atomic():
                items = list(queryset.select_for_update())
                for obj in items:
                    if not self.has_change_permission(request, obj):
                        raise PermissionDenied
                changed = [obj for obj in items if obj.published != published]
                # Validate the entire selection before changing any database row.
                for obj in changed:
                    obj.published = published
                    if published:
                        obj.full_clean()
                for obj in changed:
                    obj.last_edited_by = request.user
                    if published:
                        obj.published_by = request.user
                    obj.save(update_fields=["published", "last_edited_by", "published_by", "updated_at"])
                    self.log_change(request, obj, [{"changed": {"fields": ["published"]}}])
        except ValidationError as error:
            self.message_user(request, "Nothing was published. Review the selected content: " + "; ".join(error.messages), messages.ERROR)
            return
        self.message_user(request, f"Updated {len(changed)} records. Future publication times still apply." if published else f"Returned {len(changed)} records to draft.", messages.SUCCESS)

    @admin.action(description="Publish selected content (validate first)", permissions=["change"])
    def publish_selected(self, request, queryset):
        self._set_publication(request, queryset, True)

    @admin.action(description="Return selected content to draft", permissions=["change"])
    def unpublish_selected(self, request, queryset):
        self._set_publication(request, queryset, False)

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    readonly_fields = ["updated_at"]
    def has_add_permission(self, request):
        return super().has_add_permission(request) and not SiteSettings.objects.exists()

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["name", "kind", "status", "created_at"]
    list_filter = ["kind", "status"]
    search_fields = ["name", "email", "message"]
    readonly_fields = ["kind", "name", "email", "location", "phone", "interests", "message", "consent", "created_at", "reviewed_at", "reviewed_by"]
    actions = ["mark_reviewed", "mark_closed", "reopen"]
    list_select_related = ["reviewed_by"]
    fieldsets = [
        ("Review", {"fields": ["status", "reviewed_at", "reviewed_by"]}),
        ("Original submission", {"fields": ["kind", "name", "email", "location", "phone", "interests", "message", "consent", "created_at"]}),
    ]
    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)

    def _set_status(self, request, queryset, status):
        if not self.has_change_permission(request):
            raise PermissionDenied
        with transaction.atomic():
            items = list(queryset.select_for_update())
            for obj in items:
                if not self.has_change_permission(request, obj):
                    raise PermissionDenied
            for obj in items:
                if obj.status == status:
                    continue
                obj.status = status
                obj.reviewed_at = timezone.now()
                obj.reviewed_by = request.user
                obj.save(update_fields=["status", "reviewed_at", "reviewed_by"])
                self.log_change(request, obj, [{"changed": {"fields": ["status"]}}])
        self.message_user(request, "Selected submissions updated.", messages.SUCCESS)

    @admin.action(description="Mark selected enquiries as reviewed", permissions=["change"])
    def mark_reviewed(self, request, queryset):
        self._set_status(request, queryset, "reviewed")

    @admin.action(description="Close selected enquiries", permissions=["change"])
    def mark_closed(self, request, queryset):
        self._set_status(request, queryset, "closed")

    @admin.action(description="Reopen selected enquiries", permissions=["change"])
    def reopen(self, request, queryset):
        self._set_status(request, queryset, "new")
