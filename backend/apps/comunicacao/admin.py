from django.contrib import admin
from .models import AgendaDiaria

@admin.register(AgendaDiaria)
class AgendaDiariaAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'data', 'data_criacao')
    list_filter = ('data', 'aluno__turma', 'aluno__escola')
    search_fields = ('aluno__nome_completo', 'observacoes_professor')
    date_hierarchy = 'data'
    ordering = ('-data',)

    fieldsets = (
        (None, {
            'fields': ('aluno', 'data')
        }),
        ('Detalhes da Rotina', {
            'fields': ('atividades', 'observacoes_professor')
        }),
    )