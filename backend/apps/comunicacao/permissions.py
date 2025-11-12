"""
Permissões específicas do app Comunicação.

As permissões genéricas (IsAdminDaEscola, IsProfessor, IsResponsavel)
foram movidas para 'core.permissions'.

As regras de negócio complexas, como verificar se um professor pode postar
para um aluno específico, são tratadas diretamente nas Views (ex: AgendaDiariaViewSet).
"""
