from django.contrib import admin
from .models import AgendaDiaria, Momento, Comunicado, Comentario, Curtida

@admin.register(AgendaDiaria)
class AgendaDiariaAdmin(admin.ModelAdmin):
    """
    Admin para o modelo AgendaDiaria.
    Filtra por escola automaticamente (multi-tenancy).
    """
    list_display = ('aluno', 'data', 'escola', 'get_atividades_count', 'data_criacao')
    list_filter = ('escola', 'data', 'aluno__turma')
    search_fields = ('aluno__nome_completo', 'observacoes_professor', 'aluno__matricula')
    date_hierarchy = 'data'
    ordering = ('-data',)
    raw_id_fields = ('aluno', 'escola')

    fieldsets = (
        (None, {
            'fields': ('escola', 'aluno', 'data')
        }),
        ('Detalhes da Rotina', {
            'fields': ('atividades', 'observacoes_professor')
        }),
    )

    def get_queryset(self, request):
        """Filtra agendas por escola do usuário (se não for superuser)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(escola=request.user.escola)
        return qs.none()

    @admin.display(description='Nº de Atividades')
    def get_atividades_count(self, obj):
        """Retorna o número de atividades na agenda."""
        if isinstance(obj.atividades, list):
            return len(obj.atividades)
        return 0

    def save_model(self, request, obj, form, change):
        """Garante que a escola seja a mesma do aluno ao salvar."""
        if obj.aluno and not obj.escola:
            obj.escola = obj.aluno.escola
        super().save_model(request, obj, form, change)


# ============================================================================
# SPRINT 4 - Admins para Feed de Momentos e Comunicação
# ============================================================================

@admin.register(Momento)
class MomentoAdmin(admin.ModelAdmin):
    """Admin para o modelo Momento."""
    list_display = ('autor', 'tipo', 'turma', 'data_momento', 'escola', 'total_curtidas', 'total_comentarios', 'data_criacao')
    list_filter = ('escola', 'tipo', 'data_momento', 'turma')
    search_fields = ('autor__nome_completo', 'descricao', 'turma__nome')
    date_hierarchy = 'data_momento'
    ordering = ('-data_momento', '-data_criacao')
    raw_id_fields = ('autor', 'turma', 'escola')
    filter_horizontal = ('alunos',)
    
    fieldsets = (
        (None, {
            'fields': ('escola', 'autor', 'turma', 'alunos', 'tipo', 'data_momento')
        }),
        ('Conteúdo', {
            'fields': ('arquivo', 'descricao')
        }),
        ('Estatísticas', {
            'fields': ('total_curtidas', 'total_comentarios')
        }),
    )
    
    def get_queryset(self, request):
        """Filtra momentos por escola do usuário."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(escola=request.user.escola)
        return qs.none()


@admin.register(Comunicado)
class ComunicadoAdmin(admin.ModelAdmin):
    """Admin para o modelo Comunicado."""
    list_display = ('titulo', 'autor', 'turma', 'prioridade', 'data_publicacao', 'escola', 'total_curtidas', 'total_comentarios')
    list_filter = ('escola', 'prioridade', 'data_publicacao', 'turma')
    search_fields = ('titulo', 'conteudo', 'autor__nome_completo')
    date_hierarchy = 'data_publicacao'
    ordering = ('-prioridade', '-data_publicacao')
    raw_id_fields = ('autor', 'turma', 'escola')
    
    fieldsets = (
        (None, {
            'fields': ('escola', 'autor', 'turma', 'prioridade')
        }),
        ('Conteúdo', {
            'fields': ('titulo', 'conteudo', 'data_validade')
        }),
        ('Estatísticas', {
            'fields': ('total_curtidas', 'total_comentarios')
        }),
    )
    
    def get_queryset(self, request):
        """Filtra comunicados por escola do usuário."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(escola=request.user.escola)
        return qs.none()


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    """Admin para o modelo Comentario."""
    list_display = ('usuario', 'get_conteudo', 'momento', 'comunicado', 'data_criacao')
    list_filter = ('data_criacao',)
    search_fields = ('texto', 'usuario__nome_completo')
    ordering = ('-data_criacao',)
    raw_id_fields = ('usuario', 'momento', 'comunicado', 'comentario_pai')
    
    @admin.display(description='Conteúdo')
    def get_conteudo(self, obj):
        """Preview do comentário."""
        return obj.texto[:50] + '...' if len(obj.texto) > 50 else obj.texto


@admin.register(Curtida)
class CurtidaAdmin(admin.ModelAdmin):
    """Admin para o modelo Curtida."""
    list_display = ('usuario', 'momento', 'comunicado', 'data_criacao')
    list_filter = ('data_criacao',)
    search_fields = ('usuario__nome_completo',)
    ordering = ('-data_criacao',)
    raw_id_fields = ('usuario', 'momento', 'comunicado')