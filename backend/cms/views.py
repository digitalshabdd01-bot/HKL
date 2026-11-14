from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from .models import Content, Submission, SiteSettings
from .serializers import ContentSerializer, SubmissionSerializer, SiteSettingsSerializer
from django.db.models import Q
from django.shortcuts import get_object_or_404

def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok"})
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)

class PublicContent:
    serializer_class = ContentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "summary", "body"]
    def get_queryset(self):
        qs = Content.objects.filter(published=True, publish_at__lte=timezone.now(), language=self.request.query_params.get("language", "en"))
        slug = self.request.query_params.get("slug")
        if slug:
            qs = qs.filter(slug=slug)
        kind = self.request.query_params.get("kind")
        if kind:
            qs = qs.filter(kind=kind)
        for field in ["event_type", "profile_role"]:
            if self.request.query_params.get(field):
                qs = qs.filter(**{field: self.request.query_params[field]})
        window = self.request.query_params.get("event_window")
        if window == "upcoming":
            qs = qs.filter(Q(ends_at__gte=timezone.now()) | Q(ends_at__isnull=True, starts_at__gte=timezone.now()))
        elif window == "past":
            qs = qs.filter(Q(ends_at__lt=timezone.now()) | Q(ends_at__isnull=True, starts_at__lt=timezone.now()))
        if self.request.query_params.get("featured") == "true":
            qs = qs.filter(featured=True)
        return qs

class ContentList(PublicContent, generics.ListAPIView):
    pass

class ContentDetail(PublicContent, generics.RetrieveAPIView):
    lookup_field = "pk"

class PublicSettings(generics.RetrieveAPIView):
    serializer_class = SiteSettingsSerializer
    permission_classes = [permissions.AllowAny]
    def get_object(self):
        return get_object_or_404(SiteSettings, pk=1, published=True)

class SubmissionThrottle(AnonRateThrottle):
    scope = "submission"

class Submit(generics.CreateAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [SubmissionThrottle]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(kind=kwargs["kind"])
        return Response({"message": "Thank you. Your request has been received."}, status=status.HTTP_201_CREATED)
