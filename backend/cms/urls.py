from django.urls import path
from .views import ContentList, ContentDetail, Submit, PublicSettings
urlpatterns = [
    path("settings/", PublicSettings.as_view()),
    path("content/", ContentList.as_view()),
    path("content/<int:pk>/", ContentDetail.as_view()),
    path("contact/", Submit.as_view(), {"kind": "contact"}),
    path("volunteer/", Submit.as_view(), {"kind": "volunteer"}),
]
