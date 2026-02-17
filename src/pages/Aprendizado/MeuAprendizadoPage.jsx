import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { CourseCard } from "../../components/ui/CourseCard";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import progressoCursoService from "../../services/progressoCurso.service";
import { showErrorToast } from "../../components/feedback/toastConfig";

export function MeuAprendizadoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [stats, setStats] = useState({
    totalCursos: 0,
    cursosCompletos: 0,
    cursosEmAndamento: 0,
  });

  useEffect(() => {
    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        const result = await progressoCursoService.getMeusCursos();
        if (result.success && result.data) {
          const progressos = result.data.progressos || [];

          // Transformar progressos em cursos para exibição
          const cursosFormatados = progressos
            .filter((p) => p.cursoId) // Filtrar cursos que existem
            .map((progresso) => {
              const curso = progresso.cursoId;
              return {
                _id: curso._id,
                titulo: curso.titulo || "Curso sem título",
                descricao: curso.descricao || "",
                capa: curso.capa || null,
                materiaId: curso.materiaId,
                status: progresso.status,
                progressoPercentual: progresso.progressoPercentual || 0,
                capitulos: curso.capitulos || [],
                professorId: curso.professorId,
              };
            });

          setCursos(cursosFormatados);
          setStats({
            totalCursos: result.data.totalCursos || 0,
            cursosCompletos: result.data.cursosCompletos || 0,
            cursosEmAndamento: result.data.cursosEmAndamento || 0,
          });
        } else {
          showErrorToast(result.error || "Erro ao carregar cursos");
          setCursos([]);
        }
      } catch {
        showErrorToast("Erro ao carregar cursos");
        setCursos([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "aluno") {
      fetchCursos();
    }
  }, [user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Meu Aprendizado" />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-gray-600 mb-2">
            Total de Cursos
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-orange-500">
            {stats.totalCursos}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-gray-600 mb-2">
            Em Andamento
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-500">
            {stats.cursosEmAndamento}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-medium text-gray-600 mb-2">
            Concluídos
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-500">
            {stats.cursosCompletos}
          </p>
        </div>
      </div>

      {/* Lista de Cursos */}
      {cursos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            Você ainda não adicionou nenhum curso à sua lista de aprendizagem.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors rounded-lg py-2 px-6 text-sm font-medium"
          >
            Explorar Cursos
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {cursos.map((curso) => (
            <CourseCard
              key={curso._id}
              title={curso.titulo}
              capaUrl={curso.capa?.url}
              aulas={curso.capitulos?.length || 0}
              professorName={
                curso.professorId?.userId?.name || "Professor não encontrado"
              }
              materiaNome={curso.materiaId?.nome}
              showManageButton={false}
              showAddButton={false}
              cursoId={curso._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
