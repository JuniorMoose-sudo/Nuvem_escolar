# backend/apps/academico/apps.py
from django.apps import AppConfig

class AcademicoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.academico' # Use o caminho completo aqui
    # verbose_name = "Núcleo Acadêmico"