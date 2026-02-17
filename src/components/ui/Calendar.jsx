import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export function Calendar({ events = [] }) {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [eventsWithMore, setEventsWithMore] = useState({});

  // Adicionar displayName para ajudar o React a identificar o componente
  Calendar.displayName = 'Calendar';
  
  // Função para formatar data no formato YYYY-MM-DD usando timezone local
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Garantir que sempre usamos a data atual correta
  const getToday = () => {
    const now = new Date();
    // Normalizar para meio-dia para evitar problemas de timezone
    now.setHours(12, 0, 0, 0);
    return now;
  };

  const today = getToday();
  const todayString = formatDateLocal(today);
  const [currentDate, setCurrentDate] = useState(today);

  // Função para ordenar eventos por horário (do menor para o maior)
  const sortEventsByTime = (eventList) => {
    return [...eventList].sort((a, b) => {
      const timeA = a.extendedProps?.time?.split(' - ')[0] || '00:00';
      const timeB = b.extendedProps?.time?.split(' - ')[0] || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // Detectar se é mobile/tablet e filtrar eventos
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // Tablet e mobile (< 1024px)
      setIsMobile(mobile);
      
      // Agrupar eventos por data
      const eventsByDate = {};
      
      events.forEach(event => {
        const dateStr = event.start.split('T')[0];
        if (!eventsByDate[dateStr]) {
          eventsByDate[dateStr] = [];
        }
        eventsByDate[dateStr].push(event);
      });

      if (!mobile) {
        // Desktop: ordenar todos os eventos por horário e mostrar todos
        const sortedEvents = [];
        Object.keys(eventsByDate).forEach(dateStr => {
          const dayEvents = sortEventsByTime(eventsByDate[dateStr]);
          sortedEvents.push(...dayEvents);
        });
        setFilteredEvents(sortedEvents);
        setEventsWithMore({});
        return;
      }

      // Mobile/Tablet: ordenar por horário e pegar apenas os 2 primeiros
      const filtered = [];
      const withMore = {};

      Object.keys(eventsByDate).forEach(dateStr => {
        const dayEvents = sortEventsByTime(eventsByDate[dateStr]);

        if (dayEvents.length > 2) {
          withMore[dateStr] = true;
          filtered.push(...dayEvents.slice(0, 2));
        } else {
          filtered.push(...dayEvents);
        }
      });

      setFilteredEvents(filtered);
      setEventsWithMore(withMore);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [events]);

  // Forçar o calendário a navegar para a data atual quando montar
  useEffect(() => {
    // Pequeno delay para garantir que o calendário esteja totalmente renderizado
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        // Garantir que navegue para a data atual (hoje)
        const now = getToday();
        const currentDateStr = formatDateLocal(now);
        calendarApi.gotoDate(currentDateStr);
        // Atualizar o estado para mostrar o mês/ano correto no título
        setCurrentDate(now);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handlePrevMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      const viewDate = calendarApi.getDate();
      setCurrentDate(new Date(viewDate));
    }
  };

  const handleNextMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      const viewDate = calendarApi.getDate();
      setCurrentDate(new Date(viewDate));
    }
  };

  const formatMonthYear = (date) => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-lg border border-orange-500 overflow-hidden shadow-sm w-full">
      {/* Header do Calendário */}
      <div className="bg-white border-b border-orange-200 px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-4 w-full justify-center sm:justify-start">
          {/* Navegação de mês */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-base md:text-lg font-semibold text-gray-dark min-w-[100px] sm:min-w-[140px] text-center">
              {formatMonthYear(currentDate)}
            </span>
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-colors shrink-0"
              aria-label="Mês anterior"
            >
              <FiChevronLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-colors shrink-0"
              aria-label="Próximo mês"
            >
              <FiChevronRight size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendário */}
      <div className="p-1 sm:p-4 overflow-x-auto">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          initialDate={todayString}
          datesSet={(dateInfo) => {
            // Sincronizar a data visível no calendário
            // dateInfo.start é o primeiro dia visível no calendário
            const viewDate = new Date(dateInfo.start);
            // Criar uma nova data no primeiro dia do mês visível para evitar problemas de timezone
            const syncedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            // Só atualizar se o mês/ano realmente mudou para evitar atualizações desnecessárias
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            if (
              syncedDate.getMonth() !== currentMonth ||
              syncedDate.getFullYear() !== currentYear
            ) {
              setCurrentDate(syncedDate);
            }
          }}
          events={filteredEvents}
          height="auto"
          {...(isMobile && { dayMaxEvents: 2 })}
          fixedWeekCount={false}
          showNonCurrentDates={true}
          dayCellContent={(args) => {
            // Customizar o conteúdo da célula do dia
            const dateStr = formatDateLocal(args.date);
            const hasMore = eventsWithMore[dateStr];
            
            // Verificar se é um dia de outro mês comparando com o mês atual visível
            const cellDate = new Date(args.date);
            const cellMonth = cellDate.getMonth();
            const cellYear = cellDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const isOtherMonth = cellMonth !== currentMonth || cellYear !== currentYear;
            
            return (
              <div className="fc-daygrid-day-top">
                <span className={`fc-daygrid-day-number ${isOtherMonth ? 'fc-day-other-number' : ''}`}>
                  {args.dayNumberText}
                </span>
                {isMobile && hasMore && (
                  <span className="more-events-indicator">+</span>
                )}
              </div>
            );
          }}
          dayCellClassNames={(args) => {
            // Adicionar classe para esconder células de dias futuros muito distantes do próximo mês
            const cellDate = new Date(args.date);
            const cellMonth = cellDate.getMonth();
            const cellYear = cellDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const isOtherMonth = cellMonth !== currentMonth || cellYear !== currentYear;
            
            // Se for do próximo mês, verificar se está muito distante do último dia do mês atual
            if (isOtherMonth && cellDate > currentDate) {
              const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
              const daysFromLastDay = Math.floor((cellDate.getTime() - lastDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
              
              // Esconder se for mais de 3 dias após o último dia do mês atual
              if (daysFromLastDay > 3) {
                return 'fc-day-hidden';
              }
            }
            return '';
          }}
          dayHeaderContent={(args) => {
            // Com firstDay={1}, o FullCalendar reorganiza as colunas para começar na segunda-feira
            // args.date.getDay() retorna: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
            // Quando firstDay={1}, a ordem das colunas é: Seg(1), Ter(2), Qua(3), Qui(4), Sex(5), Sáb(6), Dom(0)
            const dayIndex = args.date.getDay();
            const daysMapFull = {
              0: "Seg",
              1: "Ter",
              2: "Qua",
              3: "Qui",
              4: "Sex",
              5: "Sab",
              6: "Dom"
            };
            const daysMapShort = {
              0: "S",
              1: "T",
              2: "Q",
              3: "Q",
              4: "S",
              5: "S",
              6: "D"
            };
            // Retornar um elemento com ambas as versões, CSS vai controlar qual mostrar
            return (
              <span>
                <span className="day-header-mobile">{daysMapShort[dayIndex]}</span>
                <span className="day-header-desktop">{daysMapFull[dayIndex]}</span>
              </span>
            );
          }}
          dayHeaderClassNames="calendar-header"
          moreLinkClassNames="calendar-more-link"
          eventClassNames="calendar-event"
          eventDisplay="block"
          moreLinkClick="popover"
          eventContent={(eventInfo) => {
            // Pegar apenas a primeira palavra do título para mobile
            const firstWord = eventInfo.event.title.split(' ')[0];
            return (
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <div className="font-semibold text-[9px] sm:text-xs md:text-sm leading-tight">
                  <span className="event-title-mobile">{firstWord}</span>
                  <span className="event-title-desktop">{eventInfo.event.title}</span>
                </div>
                {eventInfo.event.extendedProps?.time && (
                  <div className="event-time text-[8px] sm:text-[10px] md:text-xs opacity-90 leading-tight">
                    {eventInfo.event.extendedProps.time}
                  </div>
                )}
              </div>
            );
          }}
          weekends={true}
          firstDay={1}
          locale="pt-br"
          dateClick={(info) => {
            // Navegar para a página de visualizar dia quando clicar em um dia
            const dateStr = formatDateLocal(info.date);
            console.log("Date clicked:", dateStr, "Navigating to:", `/aulas/dia/${dateStr}`);
            navigate(`/aulas/dia/${dateStr}`);
          }}
          eventClick={(info) => {
            // Quando clicar em um evento, também navegar para a página do dia
            const dateStr = formatDateLocal(info.event.start);
            console.log("Event clicked, navigating to:", dateStr);
            navigate(`/aulas/dia/${dateStr}`);
          }}
          selectable={false}
          selectMirror={false}
        />
      </div>

      <style>{`
        /* Estilos base do FullCalendar */
        .fc {
          font-family: inherit;
          direction: ltr;
          text-align: left;
        }
        
        .fc table {
          border-collapse: collapse;
          border-spacing: 0;
        }
        
        .fc-scrollgrid {
          border: 1px solid #ffa94d;
        }
        
        .fc-scrollgrid th,
        .fc-scrollgrid td {
          border-width: 1px;
          border-style: solid;
        }
        
        .fc-col-header-cell {
          background-color: #fff5eb !important;
          border-color: #ffa94d !important;
          color: #2e2e2e !important;
          font-weight: 600 !important;
          padding: 4px 1px !important;
          font-size: 10px !important;
        }
        
        /* Controle de exibição dos cabeçalhos dos dias */
        .day-header-mobile {
          display: inline;
        }
        
        .day-header-desktop {
          display: none;
        }
        
        /* Controle de exibição dos títulos dos eventos */
        .event-title-mobile {
          display: inline;
        }
        
        .event-title-desktop {
          display: none;
        }
        
        /* Esconder horário em mobile */
        .event-time {
          display: none;
        }
        
        @media (min-width: 640px) {
          .fc-col-header-cell {
            padding: 8px 4px !important;
            font-size: 12px !important;
          }
          
          .day-header-mobile {
            display: none;
          }
          
          .day-header-desktop {
            display: inline;
          }
          
          .event-title-mobile {
            display: none;
          }
          
          .event-title-desktop {
            display: inline;
          }
          
          .event-time {
            display: block;
          }
        }
        
        @media (min-width: 768px) {
          .fc-col-header-cell {
            font-size: 14px !important;
          }
        }
        
        .fc-day {
          border-color: #ffa94d !important;
        }
        
        .fc-daygrid-day-frame {
          min-height: 50px !important;
          overflow: hidden !important;
        }
        
        @media (min-width: 640px) {
          .fc-daygrid-day-frame {
            min-height: 80px !important;
          }
        }
        
        @media (min-width: 768px) {
          .fc-daygrid-day-frame {
            min-height: 100px !important;
          }
        }
        
        /* Scroll apenas para desktop quando houver mais de 2 eventos */
        @media (min-width: 1024px) {
          .fc-daygrid-day-frame {
            overflow-y: auto !important;
            max-height: 200px !important;
          }
        }
        
        .fc-daygrid-day-top {
          padding: 1px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 2px !important;
        }
        
        .more-events-indicator {
          color: #ff7a00 !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          line-height: 1 !important;
        }
        
        @media (min-width: 640px) {
          .fc-daygrid-day-top {
            padding: 4px !important;
          }
          
          .more-events-indicator {
            font-size: 12px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .more-events-indicator {
            display: none !important;
          }
        }
        
        /* Estilo padrão para eventos (aulas semanais) */
        .fc-daygrid-event {
          background-color: #ff7a00 !important;
          border-color: #ff7a00 !important;
          color: white !important;
          border-radius: 2px !important;
          padding: 1px 2px !important;
          margin: 1px 0 !important;
          font-size: 9px !important;
          font-weight: 500 !important;
          line-height: 1.1 !important;
        }
        
        @media (min-width: 640px) {
          .fc-daygrid-event {
            padding: 3px 6px !important;
            margin: 2px 0 !important;
            font-size: 11px !important;
          }
        }
        
        @media (min-width: 768px) {
          .fc-daygrid-event {
            padding: 4px 8px !important;
            font-size: 12px !important;
          }
        }
        
        .fc-daygrid-event:hover {
          background-color: #e66d00 !important;
        }
        
        /* Estilo para eventos de prova - aplicar sempre com maior especificidade */
        .fc-daygrid-event.calendar-event-prova {
          background-color: #ef4444 !important;
          border-color: #ef4444 !important;
          color: white !important;
        }
        
        .fc-daygrid-event.calendar-event-prova:hover {
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
        }
        
        /* Estilo para eventos de trabalho - aplicar sempre com maior especificidade */
        .fc-daygrid-event.calendar-event-trabalho {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          color: white !important;
        }
        
        .fc-daygrid-event.calendar-event-trabalho:hover {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }
        
        .fc-day-today {
          background-color: #fff5eb !important;
        }
        
        .fc-day-today .fc-daygrid-day-number {
          background-color: #ff7a00 !important;
          color: white !important;
          border-radius: 50% !important;
          width: 18px !important;
          height: 18px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 700 !important;
          font-size: 9px !important;
        }
        
        @media (min-width: 640px) {
          .fc-day-today .fc-daygrid-day-number {
            width: 24px !important;
            height: 24px !important;
            font-size: 12px !important;
          }
        }
        
        @media (min-width: 768px) {
          .fc-day-today .fc-daygrid-day-number {
            width: 28px !important;
            height: 28px !important;
            font-size: 14px !important;
          }
        }
        
        .fc-button-primary {
          display: none !important;
        }
        
        .fc-daygrid-day-number {
          padding: 1px !important;
          color: #2e2e2e !important;
          font-size: 10px !important;
        }
        
        @media (min-width: 640px) {
          .fc-daygrid-day-number {
            padding: 3px !important;
            font-size: 12px !important;
          }
        }
        
        @media (min-width: 768px) {
          .fc-daygrid-day-number {
            padding: 4px !important;
            font-size: 14px !important;
          }
        }
        
        .fc-daygrid-day-number:hover {
          color: #ff7a00 !important;
        }
        
        /* Tornar células de dias clicáveis */
        .fc-daygrid-day {
          cursor: pointer !important;
        }
        
        .fc-daygrid-day-frame {
          cursor: pointer !important;
        }
        
        .fc-daygrid-day-top {
          cursor: pointer !important;
        }
        
        /* Dias de outros meses (anterior/próximo) */
        .fc-day-other {
          background-color: #f9f9f9 !important;
        }
        
        .fc-day-other .fc-daygrid-day-number,
        .fc-day-other-number {
          color: #9ca3af !important;
        }
        
        .fc-day-other .fc-daygrid-day-number:hover,
        .fc-day-other-number:hover {
          color: #6b7280 !important;
        }
        
        /* Esconder eventos em dias de outros meses */
        .fc-day-other .fc-daygrid-event {
          display: none !important;
        }
        
        /* Garantir que números de dias de outros meses sejam sempre visíveis */
        .fc-day-other .fc-daygrid-day-top {
          opacity: 1 !important;
        }
        
        /* Esconder células de dias futuros muito distantes */
        .fc-day-hidden {
          display: none !important;
        }
        
        /* Garantir que dias do mês anterior sejam sempre visíveis */
        .fc-day-past.fc-day-other .fc-daygrid-day-number {
          color: #9ca3af !important;
          opacity: 1 !important;
        }
        
        .calendar-header {
          background-color: #fff5eb !important;
          border-color: #ffa94d !important;
        }
        
        .calendar-day {
          border-color: #ffa94d !important;
        }
        
        .calendar-day:hover {
          background-color: #fff5eb !important;
        }
        
        .calendar-event {
          background-color: #ff7a00 !important;
          border-color: #ff7a00 !important;
        }
        
        /* Ajustes para mobile - garantir que o calendário caiba na tela */
        @media (max-width: 639px) {
          .fc-scrollgrid {
            width: 100% !important;
            min-width: auto !important;
          }
          
          .fc-scrollgrid th,
          .fc-scrollgrid td {
            width: calc(100% / 7) !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
