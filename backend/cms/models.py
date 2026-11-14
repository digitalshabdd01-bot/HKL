from django.db import models
from django.utils import timezone

class Content(models.Model):
    class Kind(models.TextChoices):
        PRACTICE = "practice", "Weekly practice"
        TALK = "talk", "Story / talk"
        EVENT = "event", "Conference / walk"
        PUBLICATION = "publication", "HKL Time issue"
        SPEAKER = "speaker", "Speaker / director"
        PAGE = "page", "Website page"
    kind = models.CharField(max_length=20, choices=Kind.choices)
    slug = models.SlugField(max_length=220)
    language = models.CharField(max_length=15, default="en")
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True)
    body = models.TextField(blank=True, help_text="Plain text; separate paragraphs with blank lines.")
    image_url = models.URLField(max_length=2000, blank=True, help_text="Use a durable HTTPS media URL.")
    video_url = models.URLField(max_length=2000, blank=True)
    resource_url = models.URLField(max_length=2000, blank=True)
    published = models.BooleanField(default=False)
    publish_at = models.DateTimeField(default=timezone.now)
    featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    episode = models.PositiveIntegerField(null=True, blank=True)
    issue_number = models.PositiveIntegerField(null=True, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=500, blank=True)
    country = models.CharField(max_length=100, blank=True)
    registration_url = models.URLField(max_length=2000, blank=True)
    speakers = models.ManyToManyField("self", symmetrical=False, blank=True, limit_choices_to={"kind": "speaker"})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-publish_at", "-id"]
        constraints = [models.UniqueConstraint(fields=["kind", "slug", "language"], name="unique_content_locale")]
        indexes = [models.Index(fields=["kind", "published", "publish_at"])]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.starts_at and self.ends_at and self.ends_at < self.starts_at:
            raise ValidationError({"ends_at": "End must be after the start."})

    def __str__(self):
        return f"{self.get_kind_display()}: {self.title}"

class Submission(models.Model):
    kind = models.CharField(max_length=20, choices=[("contact", "Contact enquiry"), ("volunteer", "Volunteer application")])
    name = models.CharField(max_length=150)
    email = models.EmailField()
    location = models.CharField(max_length=250, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    interests = models.CharField(max_length=500, blank=True)
    message = models.TextField(max_length=10000)
    consent = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=[("new", "New"), ("reviewed", "Reviewed"), ("closed", "Closed")], default="new")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self):
        return f"{self.kind}: {self.name}"
