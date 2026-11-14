from rest_framework import serializers
from .models import Content, Submission, SiteSettings
from django.utils import timezone

class ContentSerializer(serializers.ModelSerializer):
    speakers = serializers.SerializerMethodField()
    def get_speakers(self, obj):
        return list(obj.speakers.filter(kind="speaker", published=True, publish_at__lte=timezone.now()).values("id", "slug", "title"))
    class Meta:
        model = Content
        fields = ["id", "kind", "slug", "language", "title", "summary", "body", "image_url", "video_url", "resource_url", "publish_at", "featured", "sort_order", "episode", "issue_number", "starts_at", "ends_at", "location", "country", "registration_url", "event_type", "profile_role", "speakers"]

class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = ["homepage_title", "homepage_intro", "hero_image_url", "contact_email", "footer_text", "instagram_url", "youtube_url"]

class SubmissionSerializer(serializers.ModelSerializer):
    consent = serializers.BooleanField(required=True)
    class Meta:
        model = Submission
        fields = ["name", "email", "location", "phone", "interests", "message", "consent"]
        extra_kwargs = {"name": {"allow_blank": False}, "message": {"allow_blank": False}}
    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Please consent to being contacted about this request.")
        return value
