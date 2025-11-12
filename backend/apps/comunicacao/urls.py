from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgendaDiariaViewSet

app_name = 'comunicacao'

router = DefaultRouter()
router.register(r'agendas', AgendaDiariaViewSet, basename='agenda-diaria')

urlpatterns = [
    path('', include(router.urls)),
]