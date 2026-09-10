import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CalendarDays, X, ArrowRight,
  CheckCircle, Circle, Bell
} from 'lucide-react';
import api from '../services/api';
import type { Planner } from '../types';
import { Sidebar } from '../components/Sidebar';
import './CalendarView.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pre-select date from query param e.g. /calendar?date=2026-09-01
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setSelectedDay(d.getDate());
        setPanelOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/planners');
        if (res.data.success) setPlanners(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
    setPanelOpen(false);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
    setPanelOpen(false);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setPanelOpen(true);
  };

  // Map planner updatedAt dates to counts per day
  const dayPlanners = useCallback((day: number): Planner[] => {
    const iso = isoDate(viewYear, viewMonth, day);
    return planners.filter(p => {
      const d = p.updatedAt ? p.updatedAt.slice(0, 10) : '';
      const created = p.createdAt ? p.createdAt.slice(0, 10) : '';
      const reminder = p.reminderAt ? p.reminderAt.slice(0, 10) : '';
      return d === iso || created === iso || reminder === iso;
    });
  }, [planners, viewYear, viewMonth]);

  const hasReminder = (day: number): boolean => {
    const iso = isoDate(viewYear, viewMonth, day);
    return planners.some(p => p.reminderAt && p.reminderAt.slice(0, 10) === iso);
  };

  const cells = getCalendarDays(viewYear, viewMonth);
  const todayStr = today.toISOString().slice(0, 10);

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    if (selectedDay === day && panelOpen) {
      setPanelOpen(false);
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
      setPanelOpen(true);
    }
  };

  const selectedPlanners = selectedDay ? dayPlanners(selectedDay) : [];

  return (
    <div className="cal-layout">
      <Sidebar />
      <main className="cal-main">

        {/* Header */}
        <div className="cal-header">
          <div className="cal-header-left">
            <CalendarDays size={20} className="cal-header-icon" />
            <h1 className="cal-header-title">Calendar</h1>
          </div>
          <div className="cal-header-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <span className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
            <button className="cal-today-btn" onClick={goToday}>Today</button>
          </div>
        </div>

        <div className="cal-body">

          {/* Calendar Grid */}
          <div className={`cal-grid-wrap ${panelOpen ? 'has-panel' : ''}`}>
            {/* Day headers */}
            <div className="cal-day-headers">
              {DAYS.map(d => (
                <div key={d} className="cal-day-header">{d}</div>
              ))}
            </div>

            {/* Cells */}
            {loading ? (
              <div className="cal-loading">
                <div className="cal-spinner" />
                <p>Loading planners…</p>
              </div>
            ) : (
              <div className="cal-grid">
                {cells.map((day, idx) => {
                  const iso = day ? isoDate(viewYear, viewMonth, day) : '';
                  const isToday = iso === todayStr;
                  const isSelected = day === selectedDay;
                  const dayPlans = day ? dayPlanners(day) : [];
                  const hasRem = day ? hasReminder(day) : false;

                  return (
                    <div
                      key={idx}
                      className={`cal-cell ${!day ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayPlans.length > 0 ? 'has-planners' : ''}`}
                      onClick={() => handleDayClick(day)}
                    >
                      {day && (
                        <>
                          <span className="cal-cell-day">{day}</span>
                          {hasRem && <span className="cal-cell-reminder-dot" title="Reminder" />}
                          {dayPlans.length > 0 && (
                            <div className="cal-cell-badges">
                              {dayPlans.slice(0, 3).map(p => (
                                <span key={p._id} className={`cal-cell-badge ${p.isCompleted ? 'done' : ''}`}>
                                  {p.emoji}
                                </span>
                              ))}
                              {dayPlans.length > 3 && (
                                <span className="cal-cell-more">+{dayPlans.length - 3}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Day Detail Panel */}
          {panelOpen && selectedDay && (
            <div className="cal-panel">
              <div className="cal-panel-header">
                <h2 className="cal-panel-title">
                  {selectedDay} {MONTHS[viewMonth].slice(0, 3)} {viewYear}
                </h2>
                <button className="cal-panel-close" onClick={() => { setPanelOpen(false); setSelectedDay(null); }}>
                  <X size={16} />
                </button>
              </div>

              {selectedPlanners.length === 0 ? (
                <div className="cal-panel-empty">
                  <CalendarDays size={36} />
                  <p>No planners on this day.</p>
                  <button className="cal-panel-new-btn" onClick={() => navigate('/planners')}>
                    <ArrowRight size={14} /> Go to My Planners
                  </button>
                </div>
              ) : (
                <div className="cal-panel-list">
                  {selectedPlanners.map(p => (
                    <div
                      key={p._id}
                      className={`cal-panel-item ${p.isCompleted ? 'done' : ''}`}
                      onClick={() => navigate(`/planners/${p._id}`)}
                    >
                      <span className="cal-panel-emoji">{p.emoji}</span>
                      <div className="cal-panel-info">
                        <span className="cal-panel-name">{p.title}</span>
                        {p.reminderAt && (
                          <span className="cal-panel-reminder">
                            <Bell size={11} /> {new Date(p.reminderAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="cal-panel-item-right">
                        {p.isCompleted
                          ? <CheckCircle size={16} className="cal-done-icon" />
                          : <Circle size={16} className="cal-open-icon" />
                        }
                        <ArrowRight size={14} className="cal-arrow" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
