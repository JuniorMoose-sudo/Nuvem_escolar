from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # URLs Padrão
    path('admin/', admin.site.urls),

    # --- API v1 ---
    path('api/v1/', include([
        path('usuarios/', include('apps.usuarios.urls')),
        path('academico/', include('apps.academico.urls')),
        path('comunicacao/', include('apps.comunicacao.urls')),
    ])),
]