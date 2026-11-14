from django.contrib import admin
from .models import Content, Submission

@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ["title", "kind", "language", "published", "featured", "publish_at"]
    list_filter = ["kind", "language", "published", "featured"]
    search_fields = ["title", "summary", "body"]
    prepopulated_fields = {"slug": ["title"]}
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["speakers"]

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["name", "kind", "status", "created_at"]
    list_filter = ["kind", "status"]
    search_fields = ["name", "email", "message"]
    readonly_fields = ["kind", "name", "email", "location", "phone", "interests", "message", "consent", "created_at"]
    def has_add_permission(self, request):
        return False
