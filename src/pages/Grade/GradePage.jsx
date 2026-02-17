import { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import alunoService from "../../services/aluno.service";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { showErrorToast } from "../../components/feedback/toastConfig";

export function GradePage() {
  const { user } = useAuth();
  const alunoName = user?.name || "Aluno";
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(true);
  const [materias, setMaterias] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [semestreSelecionado, setSemestreSelecionado] = useState("1");

  // Buscar turmas históricas do aluno
  useEffect(() => {
    const fetchTurmas = async () => {
      setIsLoadingTurmas(true);
      try {
        const result = await alunoService.getMinhasTurmas();
        if (result.success && result.data) {
          const turmasData = result.data || [];
          setTurmas(turmasData);

          // Selecionar turma atual por padrão (ativa do ano atual)
          const anoAtual = new Date().getFullYear();
          const turmaAtual = turmasData.find(
            (t) => t.anoLetivo === anoAtual && t.status === "ativa",
          );
          if (turmaAtual) {
            setTurmaSelecionada(turmaAtual._id);
          } else if (turmasData.length > 0) {
            // Se não houver turma ativa do ano atual, selecionar a primeira
            setTurmaSelecionada(turmasData[0]._id);
          }
        } else {
          showErrorToast(result.error || "Erro ao carregar turmas");
          setTurmas([]);
        }
      } catch {
        showErrorToast("Erro ao carregar turmas");
        setTurmas([]);
      } finally {
        setIsLoadingTurmas(false);
      }
    };

    if (user?.role === "aluno") {
      fetchTurmas();
    }
  }, [user]);

  // Buscar dados do boletim
  useEffect(() => {
    const fetchBoletim = async () => {
      if (!turmaSelecionada) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await alunoService.getMeuBoletim({
          turmaId: turmaSelecionada,
        });
        if (result.success && result.data) {
          const boletim = result.data.boletim || [];
          setMaterias(boletim);
        } else {
          showErrorToast(result.error || "Erro ao carregar boletim");
          setMaterias([]);
        }
      } catch {
        showErrorToast("Erro ao carregar boletim");
        setMaterias([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "aluno" && turmaSelecionada) {
      fetchBoletim();
    }
  }, [user, turmaSelecionada]);

  // Função para formatar valor da nota
  const formatarNota = (valor) => {
    if (valor === "-") return "-";
    if (valor === "*") return "*";
    if (valor === null || valor === undefined) return "-";
    return valor;
  };

  // Função para determinar cor da situação
  const getSituacaoColor = (situacao) => {
    if (situacao === "Aprovado") return "text-green-600";
    if (situacao === "Reprovado") return "text-red-600";
    return "text-gray-600";
  };

  // Função para formatar label da turma no select
  const formatarLabelTurma = (turma) => {
    const periodoMap = {
      manha: "Manhã",
      tarde: "Tarde",
      noite: "Noite",
      integral: "Integral",
    };
    const nivelMap = {
      maternal: "Maternal",
      fundamental: "Fundamental",
      ensinoMedio: "Ensino Médio",
    };
    const periodo = periodoMap[turma.periodo] || turma.periodo;
    const nivel = nivelMap[turma.nivelEducacional] || turma.nivelEducacional;
    const status = turma.status === "ativa" ? "(Ativa)" : "(Encerrada)";
    return `${turma.nome} - ${turma.anoLetivo} - ${periodo} - ${nivel} ${status}`;
  };

  if (isLoading || isLoadingTurmas) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader title={`Boletim: ${alunoName}`} />

      {/* Select de Turmas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Turma
        </label>
        <select
          value={turmaSelecionada || ""}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          {turmas.length === 0 ? (
            <option value="">Nenhuma turma encontrada</option>
          ) : (
            turmas.map((turma) => (
              <option key={turma._id} value={turma._id}>
                {formatarLabelTurma(turma)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Select para mobile/tablet - mostrar apenas em telas menores que lg */}
      {turmaSelecionada && (
        <div className="lg:hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar Período
          </label>
          <select
            value={semestreSelecionado}
            onChange={(e) => setSemestreSelecionado(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="1">1º Semestre</option>
            <option value="2">2º Semestre</option>
            <option value="final">Final</option>
          </select>
        </div>
      )}

      {/* Tabela do Boletim - Desktop (mostrar todos os semestres) */}
      {turmaSelecionada && (
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                      Matérias
                    </th>
                    {/* Semestre 1 */}
                    <th
                      colSpan="7"
                      className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-blue-50"
                    >
                      1º Semestre
                    </th>
                    {/* Semestre 2 */}
                    <th
                      colSpan="7"
                      className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-green-50"
                    >
                      2º Semestre
                    </th>
                    {/* Média Final e Situação */}
                    <th
                      colSpan="2"
                      className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50"
                    >
                      Final
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                      {/* Matérias header - vazio */}
                    </th>
                    {/* Semestre 1 - Colunas */}
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                      PV1
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                      PV2
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                      PV3
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                      TB1
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                      TB2
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                      F
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50 border-r border-gray-200">
                      Média
                    </th>
                    {/* Semestre 2 - Colunas */}
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                      PV1
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                      PV2
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                      PV3
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                      TB1
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                      TB2
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                      F
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50 border-r border-gray-200">
                      Média
                    </th>
                    {/* Média Final e Situação */}
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-purple-50">
                      MF
                    </th>
                    <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-purple-50">
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materias.length === 0 ? (
                    <tr>
                      <td
                        colSpan="17"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhuma matéria encontrada ou você não está em nenhuma
                        turma.
                      </td>
                    </tr>
                  ) : (
                    materias.map((materia, index) => (
                      <tr
                        key={materia.materiaId || index}
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit z-10 text-center lg:text-left">
                          {materia.materiaNome}
                        </td>
                        {/* Semestre 1 - Dados */}
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                          {formatarNota(materia.semestre1.pv1)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                          {formatarNota(materia.semestre1.pv2)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                          {formatarNota(materia.semestre1.pv3)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                          {formatarNota(materia.semestre1.tb1)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                          {formatarNota(materia.semestre1.tb2)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                          {materia.semestre1.f}%
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-blue-50 border-r border-gray-200">
                          {materia.semestre1.media !== null
                            ? materia.semestre1.media
                            : "-"}
                        </td>
                        {/* Semestre 2 - Dados */}
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                          {formatarNota(materia.semestre2.pv1)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                          {formatarNota(materia.semestre2.pv2)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                          {formatarNota(materia.semestre2.pv3)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                          {formatarNota(materia.semestre2.tb1)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                          {formatarNota(materia.semestre2.tb2)}
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                          {materia.semestre2.f}%
                        </td>
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-green-50 border-r border-gray-200">
                          {materia.semestre2.media !== null
                            ? materia.semestre2.media
                            : "-"}
                        </td>
                        {/* Média Final e Situação */}
                        <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-purple-50">
                          {materia.mediaFinal !== null ? materia.mediaFinal : "-"}
                        </td>
                        <td
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-medium bg-purple-50 ${getSituacaoColor(materia.situacao)}`}
                        >
                          {materia.situacao}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tabela do Boletim - Mobile/Tablet (mostrar apenas o semestre selecionado) */}
      {turmaSelecionada && (
        <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full min-w-[400px]">
                <thead>
                  {semestreSelecionado === "final" ? (
                    <>
                      {/* Header para Final */}
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                          Matérias
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50">
                          Média Final
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50">
                          Situação
                        </th>
                      </tr>
                    </>
                  ) : (
                    <>
                      {/* Header para Semestre 1 ou 2 */}
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                          Matérias
                        </th>
                        <th
                          colSpan="7"
                          className={`px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          {semestreSelecionado === "1"
                            ? "1º Semestre"
                            : "2º Semestre"}
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                          {/* Matérias header - vazio */}
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          PV1
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          PV2
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          PV3
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          TB1
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          TB2
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          F
                        </th>
                        <th
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 ${
                            semestreSelecionado === "1"
                              ? "bg-blue-50"
                              : "bg-green-50"
                          }`}
                        >
                          Média
                        </th>
                      </tr>
                    </>
                  )}
                </thead>
                <tbody>
                  {materias.length === 0 ? (
                    <tr>
                      <td
                        colSpan={semestreSelecionado === "final" ? "3" : "8"}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhuma matéria encontrada ou você não está em nenhuma
                        turma.
                      </td>
                    </tr>
                  ) : (
                    materias.map((materia, index) => (
                      <tr
                        key={materia.materiaId || index}
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit z-10 text-center lg:text-left">
                          {materia.materiaNome}
                        </td>
                        {semestreSelecionado === "final" ? (
                          <>
                            {/* Mostrar apenas Média Final e Situação */}
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-purple-50">
                              {materia.mediaFinal !== null
                                ? materia.mediaFinal
                                : "-"}
                            </td>
                            <td
                              className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-medium bg-purple-50 ${getSituacaoColor(
                                materia.situacao,
                              )}`}
                            >
                              {materia.situacao}
                            </td>
                          </>
                        ) : semestreSelecionado === "1" ? (
                          <>
                            {/* Mostrar dados do Semestre 1 */}
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                              {formatarNota(materia.semestre1.pv1)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                              {formatarNota(materia.semestre1.pv2)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                              {formatarNota(materia.semestre1.pv3)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                              {formatarNota(materia.semestre1.tb1)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                              {formatarNota(materia.semestre1.tb2)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                              {materia.semestre1.f}%
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-blue-50 border-r border-gray-200">
                              {materia.semestre1.media !== null
                                ? materia.semestre1.media
                                : "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Mostrar dados do Semestre 2 */}
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                              {formatarNota(materia.semestre2.pv1)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                              {formatarNota(materia.semestre2.pv2)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                              {formatarNota(materia.semestre2.pv3)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                              {formatarNota(materia.semestre2.tb1)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                              {formatarNota(materia.semestre2.tb2)}
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                              {materia.semestre2.f}%
                            </td>
                            <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-green-50 border-r border-gray-200">
                              {materia.semestre2.media !== null
                                ? materia.semestre2.media
                                : "-"}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Card de Legenda */}
      {turmaSelecionada && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Legenda
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">PV1</span>
              <span className="text-xs text-gray-600">Prova 1</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">PV2</span>
              <span className="text-xs text-gray-600">Prova 2</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">PV3</span>
              <span className="text-xs text-gray-600">Prova 3</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">TB1</span>
              <span className="text-xs text-gray-600">Trabalho 1</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">TB2</span>
              <span className="text-xs text-gray-600">Trabalho 2</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">F</span>
              <span className="text-xs text-gray-600">Frequência</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">Média</span>
              <span className="text-xs text-gray-600">Média do Semestre</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">MF</span>
              <span className="text-xs text-gray-600">Média Final</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">
                Situação
              </span>
              <span className="text-xs text-gray-600">Status do Aluno</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">-</span>
              <span className="text-xs text-gray-600">
                Prova/Trabalho marcado pelo professor
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">*</span>
              <span className="text-xs text-gray-600">
                Prova/Trabalho não marcado
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
