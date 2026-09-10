import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Routine, RoutineTask } from '../types';
import {
  Activity, BrainCircuit, ListTodo, Sparkles, CheckCircle, Square,
  Trash2, Plus, X, Edit3, Save, Clock, ChevronRight,
  Lightbulb, Menu, AlertCircle, Sun, Moon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredTheme, toggleTheme as doToggle, type Theme } from '../utils/theme';
import './Routines.css';

interface DraftTask {
  taskName: string;
  estimatedMinutes: number;
  startTime: string;
  endTime: string;
  aiNotes?: string;
}

interface DraftRoutine {
  title: string;
  tasks: DraftTask[];
}

export const Routines: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<DraftRoutine | null>(null);
  const [editDraft, setEditDraft] = useState<DraftRoutine | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const handleToggleTheme = () => { const next = doToggle(); setTheme(next); };

  const fetchRoutines = async () => {
    try {
      const res = await api.get('/routines');
      if (res.data.success) setRoutines(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRoutines(); }, []);

  const handleSelectRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setAiDraft(null);
    setAiSuggestion(null);
    setEditingTask(null);
  };

  // STEP 1: Generate draft for human review
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiDraft(null);
    try {
      const res = await api.post('/ai/routine/generate', { prompt: aiPrompt });
      if (res.data.success && res.data.data.tasks?.length > 0) {
        setAiDraft(res.data.data);
        setEditDraft(JSON.parse(JSON.stringify(res.data.data)));
      } else {
        alert('AI could not generate a routine. Try a more specific description.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Unknown error';
      alert(`AI Error: ${msg}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // STEP 2: Human approves and saves
  const handleApproveAndSave = async () => {
    if (!editDraft) return;
    try {
      const saveRes = await api.post('/routines', editDraft);
      if (saveRes.data.success) {
        await fetchRoutines();
        setSelectedRoutine(saveRes.data.data);
        setAiDraft(null);
        setEditDraft(null);
        setAiPrompt('');
      }
    } catch (err) { alert('Failed to save routine'); }
  };

  // Inline task editing on saved routine
  const handleToggleTask = async (taskIndex: number) => {
    if (!selectedRoutine) return;
    const updatedTasks = selectedRoutine.tasks.map((t, i) =>
      i === taskIndex ? { ...t, isCompleted: !t.isCompleted } : t
    );
    try {
      const res = await api.put(`/routines/${selectedRoutine._id}`, { tasks: updatedTasks });
      if (res.data.success) {
        setSelectedRoutine(res.data.data);
        setRoutines(prev => prev.map(r => r._id === selectedRoutine._id ? res.data.data : r));
      }
    } catch (err) { alert('Failed to update task'); }
  };

  const handleSaveTaskEdit = async (taskIndex: number, updated: Partial<RoutineTask>) => {
    if (!selectedRoutine) return;
    const updatedTasks = selectedRoutine.tasks.map((t, i) =>
      i === taskIndex ? { ...t, ...updated } : t
    );
    try {
      const res = await api.put(`/routines/${selectedRoutine._id}`, { tasks: updatedTasks });
      if (res.data.success) {
        setSelectedRoutine(res.data.data);
        setRoutines(prev => prev.map(r => r._id === selectedRoutine._id ? res.data.data : r));
        setEditingTask(null);
      }
    } catch (err) { alert('Failed to save edit'); }
  };

  const handleAddTask = async () => {
    if (!selectedRoutine) return;
    const newTask = { taskName: 'New Task', estimatedMinutes: 30, startTime: '09:00', endTime: '09:30', isCompleted: false };
    const updatedTasks = [...selectedRoutine.tasks, newTask];
    try {
      const res = await api.put(`/routines/${selectedRoutine._id}`, { tasks: updatedTasks });
      if (res.data.success) {
        setSelectedRoutine(res.data.data);
        setRoutines(prev => prev.map(r => r._id === selectedRoutine._id ? res.data.data : r));
        setEditingTask(updatedTasks.length - 1);
      }
    } catch (err) { alert('Failed to add task'); }
  };

  const handleDeleteTask = async (idx: number) => {
    if (!selectedRoutine) return;
    const updatedTasks = selectedRoutine.tasks.filter((_, i) => i !== idx);
    try {
      const res = await api.put(`/routines/${selectedRoutine._id}`, { tasks: updatedTasks });
      if (res.data.success) {
        setSelectedRoutine(res.data.data);
        setRoutines(prev => prev.map(r => r._id === selectedRoutine._id ? res.data.data : r));
      }
    } catch (err) { alert('Failed to delete task'); }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!window.confirm('Delete this routine?')) return;
    try {
      await api.delete(`/routines/${id}`);
      setSelectedRoutine(null);
      fetchRoutines();
    } catch (err) { alert('Failed to delete routine'); }
  };

  const handleAskSuggestion = async () => {
    if (!selectedRoutine) return;
    const pending = selectedRoutine.tasks.filter(t => !t.isCompleted).map(t => t.taskName);
    if (pending.length === 0) { setAiSuggestion('🎉 You completed everything! Great job!'); return; }
    setIsAiLoading(true);
    try {
      const res = await api.post('/ai/routine/suggest', {
        routineTitle: selectedRoutine.title,
        pendingTasks: pending,
        contextPrompt: 'Based on my progress, what should I do right now?'
      });
      if (res.data.success) setAiSuggestion(res.data.data.suggestion);
    } catch (err) { alert('AI suggestion failed'); }
    finally { setIsAiLoading(false); }
  };

  const getProgress = () => {
    if (!selectedRoutine?.tasks.length) return 0;
    return Math.round((selectedRoutine.tasks.filter(t => t.isCompleted).length / selectedRoutine.tasks.length) * 100);
  };

  const progress = getProgress();

  const SUGGESTIONS = [
    'Morning routine for a software engineer',
    'Deep work 4-hour focus session',
    '6-hour marathon training timetable',
    'Evening wind-down and reflection routine',
  ];

  return (
    <div className="rt-layout">
      {/* Sidebar */}
      <aside className={`rt-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="rt-sidebar-header">
          <div className="rt-logo"><Sparkles size={20} /> TrackOS</div>
          <button className="rt-menu-toggle" onClick={() => setSidebarOpen(s => !s)}>
            <Menu size={18} />
          </button>
        </div>

        <nav className="rt-nav">
          <Link to="/" className="rt-nav-link"><Activity size={16} /> Trackers</Link>
          <Link to="/routines" className="rt-nav-link active"><ListTodo size={16} /> Routines</Link>
          <Link to="/chatbot" className="rt-nav-link"><BrainCircuit size={16} /> AI Chat</Link>
        </nav>

        <div className="rt-section-label">Your Routines</div>
        <div className="rt-routine-list">
          {routines.map(r => (
            <div
              key={r._id}
              className={`rt-routine-item ${selectedRoutine?._id === r._id ? 'active' : ''}`}
              onClick={() => handleSelectRoutine(r)}
            >
              <ListTodo size={14} />
              <span>{r.title}</span>
              <button className="rt-item-delete" onClick={(e) => { e.stopPropagation(); handleDeleteRoutine(r._id); }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {routines.length === 0 && <p className="rt-empty-hint">No routines yet. Generate one with AI!</p>}
        </div>

        <div className="rt-sidebar-bottom">
          <button className="rt-theme-btn" onClick={handleToggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="rt-main">
        {/* Mobile header */}
        <header className="rt-mobile-header">
          <button onClick={() => setSidebarOpen(s => !s)} className="rt-menu-toggle-mobile"><Menu size={22} /></button>
          <span className="rt-mobile-title">Routines</span>
          <div />
        </header>

        {/* AI Generator */}
        <div className="rt-ai-section">
          <div className="rt-ai-header">
            <BrainCircuit size={20} /><h2>AI Routine Maker</h2>
          </div>
          <form onSubmit={handleAiGenerate} className="rt-ai-form">
            <div className="rt-ai-input-wrap">
              <Sparkles size={18} className="rt-ai-icon" />
              <input
                type="text"
                placeholder="Describe your routine... e.g. 'A focused 6-hour deep work schedule with breaks'"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="rt-ai-input"
                disabled={isAiLoading}
              />
            </div>
            <button type="submit" className="rt-ai-btn" disabled={isAiLoading || !aiPrompt.trim()}>
              {isAiLoading ? <><span className="spin">⟳</span> Generating...</> : <><Sparkles size={16} /> Generate</>}
            </button>
          </form>
          {!aiDraft && !isAiLoading && (
            <div className="rt-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="rt-suggestion-chip" onClick={() => setAiPrompt(s)}>
                  {s} <ChevronRight size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Draft — Human Approval */}
        {aiDraft && editDraft && (
          <div className="rt-draft-card">
            <div className="rt-draft-header">
              <div>
                <h3>✨ AI Generated — Review & Edit Before Saving</h3>
                <p>Edit any task below then approve to save your new routine.</p>
              </div>
              <div className="rt-draft-actions">
                <button className="rt-btn-edit" onClick={() => setIsEditingDraft(e => !e)}>
                  <Edit3 size={15} /> {isEditingDraft ? 'Preview' : 'Edit Tasks'}
                </button>
                <button className="rt-btn-approve" onClick={handleApproveAndSave}>
                  <CheckCircle size={15} /> Approve & Save
                </button>
                <button className="rt-btn-discard" onClick={() => { setAiDraft(null); setEditDraft(null); }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {isEditingDraft ? (
              <input className="rt-draft-title-input" value={editDraft.title}
                onChange={e => setEditDraft({ ...editDraft, title: e.target.value })} placeholder="Routine title" />
            ) : <h4 className="rt-draft-title">{editDraft.title}</h4>}

            <div className="rt-draft-tasks">
              {editDraft.tasks.map((task, idx) => (
                <div key={idx} className="rt-draft-task-row">
                  <div className="rt-timeline-dot" />
                  {isEditingDraft ? (
                    <div className="rt-task-edit-fields">
                      <input className="rt-task-input" value={task.taskName}
                        onChange={e => { const t = [...editDraft.tasks]; t[idx] = { ...t[idx], taskName: e.target.value }; setEditDraft({ ...editDraft, tasks: t }); }}
                        placeholder="Task name" />
                      <div className="rt-task-time-row">
                        <input type="time" className="rt-task-time" value={task.startTime}
                          onChange={e => { const t = [...editDraft.tasks]; t[idx] = { ...t[idx], startTime: e.target.value }; setEditDraft({ ...editDraft, tasks: t }); }} />
                        <span>→</span>
                        <input type="time" className="rt-task-time" value={task.endTime}
                          onChange={e => { const t = [...editDraft.tasks]; t[idx] = { ...t[idx], endTime: e.target.value }; setEditDraft({ ...editDraft, tasks: t }); }} />
                        <input type="number" className="rt-task-min" value={task.estimatedMinutes}
                          onChange={e => { const t = [...editDraft.tasks]; t[idx] = { ...t[idx], estimatedMinutes: Number(e.target.value) }; setEditDraft({ ...editDraft, tasks: t }); }}
                          min={1} />
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>min</span>
                        <button className="rt-task-del" onClick={() => { const t = editDraft.tasks.filter((_, i) => i !== idx); setEditDraft({ ...editDraft, tasks: t }); }}>
                          <X size={14} />
                        </button>
                      </div>
                      <textarea className="rt-task-notes" value={task.aiNotes || ''}
                        onChange={e => { const t = [...editDraft.tasks]; t[idx] = { ...t[idx], aiNotes: e.target.value }; setEditDraft({ ...editDraft, tasks: t }); }}
                        placeholder="AI notes / description (optional)" rows={2} />
                    </div>
                  ) : (
                    <div className="rt-task-preview">
                      <div className="rt-task-name">{task.taskName}</div>
                      <div className="rt-task-time-badge">
                        <Clock size={12} /> {task.startTime} – {task.endTime} ({task.estimatedMinutes}m)
                      </div>
                      {task.aiNotes && <div className="rt-task-note">{task.aiNotes}</div>}
                    </div>
                  )}
                </div>
              ))}
              {isEditingDraft && (
                <button className="rt-add-task-btn" onClick={() => {
                  setEditDraft({
                    ...editDraft,
                    tasks: [...editDraft.tasks, { taskName: 'New Task', estimatedMinutes: 30, startTime: '09:00', endTime: '09:30' }]
                  });
                }}>
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Routine View */}
        {selectedRoutine && !aiDraft && (
          <div className="rt-routine-view">
            {/* Header */}
            <div className="rt-routine-header">
              <div className="rt-routine-title-row">
                <h2>{selectedRoutine.title}</h2>
                <button className="rt-delete-btn" onClick={() => handleDeleteRoutine(selectedRoutine._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              {/* Progress bar */}
              <div className="rt-progress-wrap">
                <div className="rt-progress-bar">
                  <div className="rt-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="rt-progress-label">{progress}% complete — {selectedRoutine.tasks.filter(t => t.isCompleted).length}/{selectedRoutine.tasks.length} tasks</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="rt-timeline">
              {selectedRoutine.tasks.map((task, idx) => (
                <div key={idx} className={`rt-timeline-item ${task.isCompleted ? 'done' : ''}`}>
                  {/* connector */}
                  {idx < selectedRoutine.tasks.length - 1 && (
                    <div className={`rt-connector ${task.isCompleted ? 'done' : ''}`} />
                  )}

                  {/* Checkbox node */}
                  <button className="rt-checkbox" onClick={() => handleToggleTask(idx)}>
                    {task.isCompleted ? <CheckCircle size={22} /> : <Square size={22} />}
                  </button>

                  {/* Content */}
                  {editingTask === idx ? (
                    <TaskEditor
                      task={task}
                      onSave={(updated) => handleSaveTaskEdit(idx, updated)}
                      onCancel={() => setEditingTask(null)}
                    />
                  ) : (
                    <div className="rt-task-content">
                      <div className="rt-task-top-row">
                        <span className="rt-task-name-live">{task.taskName}</span>
                        <div className="rt-task-actions">
                          <span className="rt-task-time-pill">
                            <Clock size={12} /> {task.startTime || '?'} – {task.endTime || '?'} ({task.estimatedMinutes}m)
                          </span>
                          <button className="rt-edit-task-btn" onClick={() => setEditingTask(idx)} title="Edit task">
                            <Edit3 size={14} />
                          </button>
                          <button className="rt-del-task-btn" onClick={() => handleDeleteTask(idx)} title="Delete task">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {task.aiNotes && <p className="rt-task-note-live">{task.aiNotes}</p>}
                    </div>
                  )}
                </div>
              ))}

              <button className="rt-add-task-live" onClick={handleAddTask}>
                <Plus size={16} /> Add Task
              </button>
            </div>

            {/* AI Co-Pilot */}
            <div className="rt-copilot">
              <div className="rt-copilot-header">
                <div className="rt-copilot-title">
                  <Lightbulb size={18} /> AI Co-Pilot
                </div>
                <button className="rt-copilot-btn" onClick={handleAskSuggestion} disabled={isAiLoading}>
                  {isAiLoading ? <><span className="spin">⟳</span> Analyzing...</> : 'What should I do next?'}
                </button>
              </div>
              {aiSuggestion && (
                <div className="rt-copilot-reply">
                  <AlertCircle size={16} />
                  <p>{aiSuggestion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedRoutine && !aiDraft && !isAiLoading && (
          <div className="rt-empty-state">
            <Sparkles size={52} />
            <h2>Create Your First Routine</h2>
            <p>Describe your workflow above and AI will build a fully timed timeline for you to review and approve.</p>
          </div>
        )}
      </main>
    </div>
  );
};

// Inline Task Editor Component
const TaskEditor: React.FC<{
  task: RoutineTask;
  onSave: (updated: Partial<RoutineTask>) => void;
  onCancel: () => void;
}> = ({ task, onSave, onCancel }) => {
  const [name, setName] = useState(task.taskName);
  const [start, setStart] = useState(task.startTime || '09:00');
  const [end, setEnd] = useState(task.endTime || '09:30');
  const [mins, setMins] = useState(task.estimatedMinutes);
  const [notes, setNotes] = useState(task.aiNotes || '');

  return (
    <div className="rt-task-editor">
      <input className="rt-editor-input" value={name} onChange={e => setName(e.target.value)} placeholder="Task name" autoFocus />
      <div className="rt-editor-time-row">
        <input type="time" className="rt-editor-time" value={start} onChange={e => setStart(e.target.value)} />
        <span>→</span>
        <input type="time" className="rt-editor-time" value={end} onChange={e => setEnd(e.target.value)} />
        <input type="number" className="rt-editor-mins" value={mins} onChange={e => setMins(Number(e.target.value))} min={1} />
        <span style={{ fontSize: '0.8rem', color: '#888' }}>min</span>
      </div>
      <textarea className="rt-editor-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / description (optional)" rows={2} />
      <div className="rt-editor-actions">
        <button className="rt-editor-save" onClick={() => onSave({ taskName: name, startTime: start, endTime: end, estimatedMinutes: mins, aiNotes: notes })}>
          <Save size={14} /> Save
        </button>
        <button className="rt-editor-cancel" onClick={onCancel}><X size={14} /> Cancel</button>
      </div>
    </div>
  );
};
