import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Calendar } from "../../components/ui/Calendar";
import { useAuth } from "../../context/AuthContext";
import aulaSemanalService from "../../services/aulaSemanal.service";
import atividadeService from "../../services/atividade.service";

// Função para encontrar todas as datas de um dia da semana em um intervalo
const getDatesForDayOfWeek = (dayOfWeek, startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  
  // Ajustar para o primeiro dia da semana desejada a partir da data inicial
  const currentDay = current.getDay();
  const dayDiff = (dayOfWeek - currentDay + 7) % 7;
  current.setDate(current.getDate() + dayDiff);
  
  // Se a data ajustada ainda está antes da data inicial, avançar uma semana
  if (current < startDate) {
    current.setDate(current.getDate() + 7);
  }
  
  // Encontrar todas as ocorrências até a data final
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7); // Próxima semana
  }
  
  return dates;
};

// Função para verificar se uma data está dentro do semestre
const isDateInSemester = (date, semestre) => {
  const month = date.getMonth() + 1; // getMonth() retorna 0-11, então adicionamos 1
  
  if (semestre === "1") {
    // 1º Semestre: fevereiro (2) até junho (6)
    return month >= 2 && month <= 6;
  } else if (semestre === "2") {
    // 2º Semestre: agosto (8) até novembro (11)
    return month >= 8 && month <= 11;
  }
  
  return false;
};

// Função para converter aulas semanais em eventos do calendário
const convertAulasToEvents = (aulasSemanais, startDate, endDate) => {
  const events = [];
  
  aulasSemanais.forEach((aula) => {
    if (aula.status !== "ativa") return;
    
    // Encontrar todas as datas para este dia da semana no intervalo
    const dates = getDatesForDayOfWeek(aula.diaSemana, startDate, endDate);
    
    // Criar título da aula
    const turmaNome = aula.turmaId?.nome || "Turma";
    const materiaNome = aula.materiaId?.nome || "Matéria";
    const title = `${materiaNome} - ${turmaNome}`;
    
    // Criar evento para cada data, mas apenas se estiver no semestre correto
    dates.forEach((date) => {
      // Se a aula tem semestre definido, verificar se a data está no semestre correto
      // Se não tem semestre (aulas antigas), mostrar em todas as datas
      if (aula.semestre) {
        if (!isDateInSemester(date, aula.semestre)) {
          return; // Pular esta data se não estiver no semestre
        }
      }
      
      const dateStr = date.toISOString().split('T')[0];
      events.push({
        title,
        start: dateStr,
        extendedProps: {
          time: `${aula.horarioInicio} - ${aula.horarioFim}`,
          type: "aula", // Tipo de evento: aula
        },
      });
    });
  });
  
  return events;
};

// Função para converter atividades em eventos do calendário
const convertAtividadesToEvents = (atividades) => {
  const events = [];
  
  atividades.forEach((atividade) => {
    // Formatar data da atividade
    const atividadeDate = new Date(atividade.data);
    const dateStr = atividadeDate.toISOString().split('T')[0];
    
   
    const title = `${atividade.nome}`;
    
    // Criar horário formatado
    const time = atividade.horarioInicio && atividade.horarioFim 
      ? `${atividade.horarioInicio} - ${atividade.horarioFim}`
      : null;
    
    events.push({
      title,
      start: dateStr,
      extendedProps: {
        type: atividade.tipo, // Tipo de evento: prova ou trabalho
        atividadeId: atividade._id,
        time, // Horário da atividade
      },
      className: atividade.tipo === "prova" ? "calendar-event-prova" : "calendar-event-trabalho",
    });
  });
  
  return events;
};

export function AulasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aulasSemanais, setAulasSemanais] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Admin, professor e aluno podem ver o calendário
      if (user?.role === "admin" || user?.role === "professor" || user?.role === "aluno") {
        setIsLoading(true);
        
        // Buscar aulas semanais e atividades em paralelo
        // O backend já filtra automaticamente por professor/aluno quando necessário
        const [aulasResult, atividadesResult] = await Promise.all([
          aulaSemanalService.getAll(),
          atividadeService.getAll(),
        ]);
        
        if (aulasResult.success) {
          setAulasSemanais(aulasResult.data || []);
        }
        
        if (atividadesResult.success) {
          setAtividades(atividadesResult.data || []);
        }
        
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Converter aulas semanais e atividades em eventos do calendário
  useEffect(() => {
    const allEvents = [];

    // Converter aulas semanais
    if (aulasSemanais.length > 0) {
      // Calcular intervalo de datas para cobrir todo o ano letivo
      // Vamos mostrar desde o início do ano até o final do ano
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Início: primeiro dia de janeiro do ano atual
      const startDate = new Date(currentYear, 0, 1);
      
      // Fim: último dia de dezembro do ano atual
      const endDate = new Date(currentYear, 11, 31);
      
      const aulasEvents = convertAulasToEvents(aulasSemanais, startDate, endDate);
      allEvents.push(...aulasEvents);
    }

    // Converter atividades (provas e trabalhos)
    if (atividades.length > 0) {
      const atividadesEvents = convertAtividadesToEvents(atividades);
      allEvents.push(...atividadesEvents);
    }

    setEvents(allEvents);
  }, [aulasSemanais, atividades]);

  // Preparar botões do header
  const headerButtons = [];
  
  if (user?.role === "admin") {
    headerButtons.push({
      text: "Adicionar Aula",
      onClick: () => navigate("/aulas/novo"),
    });
  }
  
  // Adicionar botão de atividade para admin e professor
  if (user?.role === "admin" || user?.role === "professor") {
    headerButtons.push({
      text: "Adicionar Atividade",
      onClick: () => navigate("/atividades/novo"),
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Aulas"
        buttons={headerButtons.length > 0 ? headerButtons : undefined}
      />
      <section>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando aulas...</p>
          </div>
        ) : (
          <Calendar events={events} />
        )}
      </section>
    </div>
  );
}
