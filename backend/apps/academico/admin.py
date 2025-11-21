from django.contrib import admin
from .models import Aluno, Turma, Materia, ProfessorTurma, ResponsavelAluno

@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    """
    Admin para o modelo Turma.
    Filtra por escola automaticamente.
    """
    list_display = ('nome', 'ano_letivo', 'escola', 'professor_principal', 'get_alunos_count')
    list_filter = ('escola', 'ano_letivo')
    search_fields = ('nome', 'escola__nome_fantasia')
    raw_id_fields = ('professor_principal',)
    
    def get_queryset(self, request):
        """Filtra turmas por escola do usuário (se não for superuser)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(escola=request.user.escola)
        return qs.none()
    
    @admin.display(description='Nº de Alunos')
    def get_alunos_count(self, obj):
        """Retorna o número de alunos na turma."""
        return obj.alunos.count()

@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    """
    Admin para o modelo Materia.
    Filtra por escola automaticamente.
    """
    list_display = ('nome', 'escola')
    list_filter = ('escola',)
    search_fields = ('nome', 'escola__nome_fantasia')
    
    def get_queryset(self, request):
        """Filtra matérias por escola do usuário (se não for superuser)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(escola=request.user.escola)
        return qs.none()

@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    """
    Admin para o modelo Aluno.
    Filtra por escola automaticamente.
    """
    list_display = ('nome_completo', 'matricula', 'turma', 'escola', 'get_responsaveis_count')
    list_filter = ('escola', 'turma')
    search_fields = ('nome_completo', 'matricula', 'escola__nome_fantasia')
    raw_id_fields = ('turma',)
    
    def get_queryset(self, request):
        """Filtra alunos por escola do usuário (se não for superuser)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(escola=request.user.escola)
        return qs.none()
    
    @admin.display(description='Nº de Responsáveis')
    def get_responsaveis_count(self, obj):
        """Retorna o número de responsáveis vinculados ao aluno."""
        return obj.vinculos_responsaveis.count()

@admin.register(ProfessorTurma)
class ProfessorTurmaAdmin(admin.ModelAdmin):
    """
    Admin para o modelo ProfessorTurma (vínculo professor-turma-matéria).
    """
    list_display = ('professor', 'turma', 'materia', 'get_escola')
    list_filter = ('turma__escola', 'materia')
    search_fields = (
        'professor__usuario__nome_completo',
        'professor__usuario__email',
        'turma__nome',
        'materia__nome'
    )
    raw_id_fields = ('professor', 'turma', 'materia')
    
    def get_queryset(self, request):
        """Filtra vínculos por escola do usuário (se não for superuser)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(turma__escola=request.user.escola)
        return qs.none()
    
    @admin.display(description='Escola')
    def get_escola(self, obj):
        """Retorna a escola da turma."""
        return obj.turma.escola

@admin.register(ResponsavelAluno)
class ResponsavelAlunoAdmin(admin.ModelAdmin):
    """
    Admin para o modelo ResponsavelAluno (vínculo responsável-aluno).
    """
    list_display = ('responsavel', 'aluno', 'parentesco', 'responsavel_principal', 'get_escola')
    list_filter = ('parentesco', 'responsavel_principal', 'aluno__escola')
    search_fields = (
        'responsavel__usuario__nome_completo',
        'responsavel__usuario__email',
        'aluno__nome_completo',
        'aluno__matricula'
    )
    raw_id_fields = ('responsavel', 'aluno')
    
    def get_queryset(self, request):
        """Filtra vínculos por escola do usuário (se não for superuser)."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'escola') and request.user.escola:
            return qs.filter(aluno__escola=request.user.escola)
        return qs.none()
    
    @admin.display(description='Escola')
    def get_escola(self, obj):
        """Retorna a escola do aluno."""
        return obj.aluno.escola
