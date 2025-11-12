from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MateriaViewSet,
    TurmaViewSet,
    AlunoViewSet,
    ProfessorTurmaViewSet,
    ResponsavelAlunoViewSet
)

# Cria um roteador e registra os ViewSets
router = DefaultRouter()
router.register(r'materias', MateriaViewSet, basename='materia')
router.register(r'turmas', TurmaViewSet, basename='turma')
router.register(r'alunos', AlunoViewSet, basename='aluno')
router.register(r'vinculos/professores', ProfessorTurmaViewSet, basename='professor-turma')
router.register(r'vinculos/responsaveis', ResponsavelAlunoViewSet, basename='responsavel-aluno')

# As urlpatterns incluirão todas as rotas geradas pelo router
app_name = 'academico'
urlpatterns = [
    path('', include(router.urls)),
]