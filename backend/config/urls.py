from django.contrib import admin
from django.urls import include, path
from cms.views import health

admin.site.site_header = "HKL Content Administration"
admin.site.site_title = "HKL Admin"
urlpatterns = [path("admin/", admin.site.urls), path("api/v1/", include("cms.urls")), path("health/", health)]
