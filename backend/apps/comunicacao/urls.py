from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AgendaDiariaViewSet,
    MomentoViewSet,
    ComunicadoViewSet,
    ComentarioViewSet,
    CurtidaViewSet
)

app_name = 'comunicacao'

router = DefaultRouter()
router.register(r'agendas', AgendaDiariaViewSet, basename='agenda-diaria')
router.register(r'momentos', MomentoViewSet, basename='momento')
router.register(r'comunicados', ComunicadoViewSet, basename='comunicado')
router.register(r'comentarios', ComentarioViewSet, basename='comentario')
router.register(r'curtidas', CurtidaViewSet, basename='curtida')

urlpatterns = [
    path('', include(router.urls)),
]