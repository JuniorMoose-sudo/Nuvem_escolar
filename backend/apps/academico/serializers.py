from rest_framework import serializers
from .models import Aluno, Turma, Materia, ProfessorTurma, ResponsavelAluno

class AlunoSerializer(serializers.ModelSerializer):
    escola = serializers.PrimaryKeyRelatedField(read_only=True)
    turma_id = serializers.UUIDField(source='turma', write_only=True, required=False, allow_null=True)

    class Meta:
        model = Aluno
        fields = ['id', 'nome_completo', 'matricula', 'turma', 'turma_id', 'escola']
        read_only_fields = ['escola', 'turma']

    def create(self, validated_data):
        escola = self.context['request'].user.escola
        aluno = Aluno.objects.create(escola=escola, **validated_data)
        return aluno

class MateriaSerializer(serializers.ModelSerializer):
    escola = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Materia
        fields = ['id', 'nome', 'escola']
        read_only_fields = ['escola']

    def create(self, validated_data):
        escola = self.context['request'].user.escola
        materia = Materia.objects.create(escola=escola, **validated_data)
        return materia

class TurmaSerializer(serializers.ModelSerializer):
    escola = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Turma
        fields = ['id', 'nome', 'ano_letivo', 'professor_principal', 'escola']
        read_only_fields = ['escola']

    def create(self, validated_data):
        escola = self.context['request'].user.escola
        turma = Turma.objects.create(escola=escola, **validated_data)
        return turma

class ProfessorTurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessorTurma
        fields = ['id', 'professor', 'turma', 'materia']

class ResponsavelAlunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponsavelAluno
        fields = ['id', 'responsavel', 'aluno', 'parentesco', 'responsavel_principal']