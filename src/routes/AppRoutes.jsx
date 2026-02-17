import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/Auth/LoginPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { AlunosPage } from "../pages/Users/AlunosPage";
import { ProfessoresPage } from "../pages/Users/ProfessoresPage";
import { ResponsaveisPage } from "../pages/Responsaveis/ResponsaveisPage";
import { TurmasPage } from "../pages/Turmas/TurmasPage";
import { MateriasPage } from "../pages/Materias/MateriasPage";
import { MateriaForm } from "../pages/Materias/MateriaForm";
import { MateriaEditForm } from "../pages/Materias/MateriaEditForm";
import { MateriaViewPage } from "../pages/Materias/MateriaViewPage";
import { AulasPage } from "../pages/Aulas/AulasPage";
import { AulaForm } from "../pages/Aulas/AulaForm";
import { VisualizarDia } from "../pages/Aulas/VisualizarDia";
import { AulaPage } from "../pages/Aulas/AulaPage";
import { AtividadeForm } from "../pages/Atividades/AtividadeForm";
import { ProvaPage } from "../pages/Atividades/ProvaPage";
import { CursoPage } from "../pages/Courses/CursoPage";
import { CursoForm } from "../pages/Courses/CursoForm";
import { CursoEditForm } from "../pages/Courses/CursoEditForm";
import { AulaEditForm } from "../pages/Courses/AulaEditForm";
import { CapituloEditForm } from "../pages/Courses/CapituloEditForm";
import { GradePage } from "../pages/Grade/GradePage";
import { MeuAprendizadoPage } from "../pages/Aprendizado/MeuAprendizadoPage";
import { AlunoForm } from "../pages/Users/AlunoForm";
import { AlunoViewPage } from "../pages/Users/AlunoViewPage";
import { ProfessorForm } from "../pages/Users/ProfessorForm";
import { ProfessorViewPage } from "../pages/Users/ProfessorViewPage";
import { ProfilePage } from "../pages/Profile/ProfilePage";
import { ResponsavelForm } from "../pages/Responsaveis/ResponsavelForm";
import { ResponsavelViewPage } from "../pages/Responsaveis/ResponsavelViewPage";
import { TurmaForm } from "../pages/Turmas/TurmaForm";
import { TurmaEditForm } from "../pages/Turmas/TurmaEditForm";
import { TurmaViewPage } from "../pages/Turmas/TurmaViewPage";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

function LoginRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alunos"
        element={
          <ProtectedRoute>
            <AlunosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alunos/novo"
        element={
          <ProtectedRoute>
            <AlunoForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alunos/:id/editar"
        element={
          <ProtectedRoute>
            <AlunoForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alunos/:id"
        element={
          <ProtectedRoute>
            <AlunoViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professores"
        element={
          <ProtectedRoute>
            <ProfessoresPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professores/novo"
        element={
          <ProtectedRoute>
            <ProfessorForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professores/:id/editar"
        element={
          <ProtectedRoute>
            <ProfessorForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professores/:id"
        element={
          <ProtectedRoute>
            <ProfessorViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responsaveis"
        element={
          <ProtectedRoute>
            <ResponsaveisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responsaveis/novo"
        element={
          <ProtectedRoute>
            <ResponsavelForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responsaveis/:id/editar"
        element={
          <ProtectedRoute>
            <ResponsavelForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responsaveis/:id"
        element={
          <ProtectedRoute>
            <ResponsavelViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turmas"
        element={
          <ProtectedRoute>
            <TurmasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turmas/novo"
        element={
          <ProtectedRoute>
            <TurmaForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turmas/:id/editar"
        element={
          <ProtectedRoute>
            <TurmaEditForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turmas/:id"
        element={
          <ProtectedRoute>
            <TurmaViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materias"
        element={
          <ProtectedRoute>
            <MateriasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materias/novo"
        element={
          <ProtectedRoute>
            <MateriaForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materias/:id/editar"
        element={
          <ProtectedRoute>
            <MateriaEditForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materias/:id"
        element={
          <ProtectedRoute>
            <MateriaViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aulas"
        element={
          <ProtectedRoute>
            <AulasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aulas/novo"
        element={
          <ProtectedRoute>
            <AulaForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aulas/dia/:data"
        element={
          <ProtectedRoute>
            <VisualizarDia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aulas/:materiaId/:turmaId"
        element={
          <ProtectedRoute>
            <AulaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/atividades/:atividadeId"
        element={
          <ProtectedRoute>
            <ProvaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/atividades/novo"
        element={
          <ProtectedRoute>
            <AtividadeForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cursos/novo"
        element={
          <ProtectedRoute>
            <CursoForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cursos/:id"
        element={
          <ProtectedRoute>
            <CursoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/listacursos/curso/:id"
        element={
          <ProtectedRoute>
            <CursoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/curso/:id/editar"
        element={
          <ProtectedRoute allowedRoles={["professor"]}>
            <CursoEditForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/curso/:cursoId/capitulo/:capituloIndex/aula/:aulaIndex/editar"
        element={
          <ProtectedRoute>
            <AulaEditForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/curso/:cursoId/capitulo/:capituloIndex/editar"
        element={
          <ProtectedRoute>
            <CapituloEditForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boletim"
        element={
          <ProtectedRoute>
            <GradePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meu-aprendizado"
        element={
          <ProtectedRoute allowedRoles={["aluno"]}>
            <MeuAprendizadoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute allowedRoles={["aluno", "professor"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
