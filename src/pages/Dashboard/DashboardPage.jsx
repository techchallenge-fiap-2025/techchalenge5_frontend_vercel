import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiBook,
  FiUsers,
  FiBookOpen,
  FiSearch,
  FiPlus,
} from "react-icons/fi";
import { StatsCards } from "../../components/ui/StatsCards";
import { CourseCard } from "../../components/ui/CourseCard";
import { CourseFilters } from "../../components/ui/CourseFilters";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import dashboardService from "../../services/dashboard.service";
import cursoService from "../../services/curso.service";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    materias: 0,
    alunos: 0,
    professores: 0,
    cursos: 0,
    turmas: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [isLoadingCursos, setIsLoadingCursos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ordem: null, materiaId: null });

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      const result = await dashboardService.getStats();
      if (result.success) {
        setStats(result.data);
      }
      setIsLoadingStats(false);
    };

    const fetchCursos = async () => {
      setIsLoadingCursos(true);
      const startTime = Date.now();
      
      const result = await cursoService.getAll(filters);
      
      // Garantir que o loading seja exibido por pelo menos 1,5 segundos
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1500; // 1,5 segundos
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      
      if (result.success) {
        setCursos(result.data || []);
      }
      setIsLoadingCursos(false);
    };

    if (user) {
      fetchCursos(); // Buscar cursos para todos os roles
      if (user.role !== "aluno") {
        fetchStats(); // Buscar stats apenas para admin/professor
      }
    }
  }, [user, filters]);

  // Filtrar cursos por termo de busca (filtro local no frontend)
  const filteredCursos = cursos.filter((curso) => {
    if (!searchTerm) return true;
    const titulo = (curso.titulo || curso.nome || "").toLowerCase();
    return titulo.includes(searchTerm.toLowerCase());
  });

  // Renderização para alunos
  if (user?.role === "aluno") {
    return (
      <div className="space-y-8">
        {isLoadingCursos && <LoadingScreen />}
        <h1 className="text-2xl font-semibold text-gray-dark">
          Bem vindo de volta,{" "}
          <span className="text-orange-500">{user?.name || "Usuário"}</span> 👋
        </h1>

        {/* Seção Cursos */}
        <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
          <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-dark">Cursos</h2>
            </div>
          </div>
        </div>

        {/* Campo de busca e filtro */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          {/* Campo de busca */}
          <div className="relative flex-1 sm:flex-initial bg-white rounded-lg">
            <input
              type="text"
              placeholder="Buscar ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 pr-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-dark"
            />
            <FiSearch
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
              size={18}
            />
          </div>
          {/* Componente de filtros */}
          <CourseFilters
            onFilterChange={(newFilters) => setFilters(newFilters)}
          />
        </div>

        {/* Lista de Cursos */}
        {isLoadingCursos ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando cursos...</p>
          </div>
        ) : filteredCursos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm || filters.ordem || filters.materiaId
                ? "Nenhum curso encontrado com os filtros aplicados."
                : "Nenhum curso cadastrado no momento."}
            </p>
          </div>
        ) : (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-6">
              {filteredCursos.map((curso) => (
                <CourseCard
                  key={curso._id}
                  title={curso.titulo || curso.nome || "Curso sem título"}
                  capaUrl={curso.capa?.url}
                  aulas={curso.capitulos?.length || 0}
                  professorName={
                    curso.professorId?.userId?.name ||
                    "Professor não encontrado"
                  }
                  materiaNome={curso.materiaId?.nome}
                  showManageButton={false}
                  showAddButton={true}
                  cursoId={curso._id}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isLoadingCursos && <LoadingScreen />}
      <h1 className="text-2xl font-semibold text-gray-dark">
        Bem vindo de volta,{" "}
        <span className="text-orange-500">{user?.name || "Usuário"}</span> 👋
      </h1>
      {isLoadingStats ? (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-20">
            <StatsCards title="Materias" value="..." icon={<FiBook />} />
            <StatsCards title="Alunos" value="..." icon={<FiUsers />} />
            <StatsCards
              title={user?.role === "admin" ? "Professores" : "Cursos"}
              value="..."
              icon={<FiBarChart2 />}
            />
            <StatsCards title="Turmas" value="..." icon={<FiBookOpen />} />
          </div>
        </section>
      ) : (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-20">
            <StatsCards
              title="Materias"
              value={stats.materias.toString()}
              icon={<FiBook />}
            />
            <StatsCards
              title="Alunos"
              value={stats.alunos.toString()}
              icon={<FiUsers />}
            />
            {user?.role === "admin" ? (
              <StatsCards
                title="Professores"
                value={stats.professores.toString()}
                icon={<FiBarChart2 />}
              />
            ) : (
              <StatsCards
                title="Cursos"
                value={stats.cursos.toString()}
                icon={<FiBarChart2 />}
              />
            )}
            <StatsCards
              title="Turmas"
              value={stats.turmas.toString()}
              icon={<FiBookOpen />}
            />
          </div>
        </section>
      )}
      {/* Seção Cursos com background que se estende por toda a largura */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
          <div className="flex flex-row items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-dark">
              Cursos
            </h2>
            {user?.role === "professor" && (
              <button
                onClick={() => navigate("/cursos/novo")}
                className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors rounded-lg py-2 px-4 sm:px-6 text-sm font-medium whitespace-nowrap flex items-center gap-2"
              >
                <FiPlus size={18} />
                <span>Adicionar Curso</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
        {/* Campo de busca */}
        <div className="relative flex-1 sm:flex-initial bg-white rounded-lg ">
          <input
            type="text"
            placeholder="Buscar ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 pr-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-dark"
          />
          <FiSearch
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
            size={18}
          />
        </div>
        {/* Componente de filtros */}
        <CourseFilters
          onFilterChange={(newFilters) => setFilters(newFilters)}
        />
      </div>
      <section>
        {isLoadingCursos ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando cursos...</p>
          </div>
        ) : filteredCursos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm || filters.ordem || filters.materiaId
                ? "Nenhum curso encontrado com os filtros aplicados."
                : "Nenhum curso cadastrado no momento."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-6">
            {filteredCursos.map((curso) => (
              <CourseCard
                key={curso._id}
                title={curso.titulo || curso.nome || "Curso sem título"}
                capaUrl={curso.capa?.url}
                aulas={curso.capitulos?.length || 0}
                professorName={
                  curso.professorId?.userId?.name || "Professor não encontrado"
                }
                materiaNome={curso.materiaId?.nome}
                showManageButton={false}
                cursoId={curso._id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
