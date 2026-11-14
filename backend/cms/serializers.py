from rest_framework import serializers
from .models import Content, Submission

class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ["id", "kind", "slug", "language", "title", "summary", "body", "image_url", "video_url", "resource_url", "publish_at", "featured", "sort_order", "episode", "issue_number", "starts_at", "ends_at", "location", "country", "registration_url"]

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
