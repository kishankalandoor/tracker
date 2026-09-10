import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { TrackerDefinition, TrackerField } from '../types';
import { UniversalForm } from '../components/UniversalForm';
import {
  Activity, BrainCircuit, ListTodo, Sparkles, CheckCircle,
  Edit2, Trash2, Plus, X, BarChart2, ChevronRight,
  LogOut, Menu, Sun, Moon, BookTemplate, FolderOpen, CalendarDays
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStoredTheme, toggleTheme as doToggle, type Theme } from '../utils/theme';
import './Dashboard.css';

interface AiDraft {
  name: string;
  category: string;
  description: string;
  fields: TrackerField[];
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [trackers, setTrackers] = useState<TrackerDefinition[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<TrackerDefinition | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const handleToggleTheme = () => { const next = doToggle(); setTheme(next); };

  // Edit states for AI draft approval
  const [editDraft, setEditDraft] = useState<AiDraft | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const fetchTrackers = async () => {
    try {
      const res = await api.get('/trackers');
      if (res.data.success) setTrackers(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTrackers(); }, []);

  const handleSelectTracker = async (tracker: TrackerDefinition) => {
    setSelectedTracker(tracker);
    setAiDraft(null);
    try {
      const res = await api.get(`/trackers/${tracker._id}/entries`);
      if (res.data.success) setEntries(res.data.data.reverse());
    } catch (err) { console.error(err); }
  };

  const handleEntrySubmit = async (data: any) => {
    if (!selectedTracker) return;
    try {
      const res = await api.post(`/trackers/${selectedTracker._id}/entries`, { data });
      if (res.data.success) {
        setEntries(prev => [...prev, res.data.data]);
      }
    } catch (err) { console.error(err); }
  };

  // STEP 1: AI Generates draft for human review
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiDraft(null);
    setIsEditingDraft(false);
    try {
      const res = await api.post('/ai/generate', { prompt: aiPrompt });
      if (res.data.success && res.data.data.fields?.length > 0) {
        setAiDraft(res.data.data);
        setEditDraft(JSON.parse(JSON.stringify(res.data.data))); // deep copy for editing
      } else {
        alert('AI could not generate a valid tracker. Try a clearer description.');
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
      const saveRes = await api.post('/trackers', { ...editDraft, isTemplate: false });
      if (saveRes.data.success) {
        await fetchTrackers();
        handleSelectTracker(saveRes.data.data);
        setAiDraft(null);
        setEditDraft(null);
        setAiPrompt('');
      }
    } catch (err) {
      alert('Failed to save tracker');
    }
  };

  const handleDeleteTracker = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this tracker?')) return;
    try {
      await api.delete(`/trackers/${id}`);
      if (selectedTracker?._id === id) setSelectedTracker(null);
      fetchTrackers();
    } catch (err) { alert('Failed to delete'); }
  };

  const updateDraftField = (idx: number, key: string, val: any) => {
    if (!editDraft) return;
    const fields = [...editDraft.fields];
    fields[idx] = { ...fields[idx], [key]: val };
    setEditDraft({ ...editDraft, fields });
  };

  const removeDraftField = (idx: number) => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, fields: editDraft.fields.filter((_, i) => i !== idx) });
  };

  const addDraftField = () => {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      fields: [...editDraft.fields, { fieldKey: `field_${Date.now()}`, label: 'New Field', type: 'text', required: false }]
    });
  };

  const getChartData = () => {
    if (!selectedTracker || entries.length === 0) return [];
    const numField = selectedTracker.fields.find(f => f.type === 'number');
    if (!numField) return [];
    return entries.map((e, idx) => ({
      name: `#${idx + 1}`,
      value: Number(e.data[numField.fieldKey]) || 0,
    }));
  };

  const chartData = getChartData();

  const SUGGESTIONS = [
    'Marathon training tracker with distance and pace',
    'Daily mood and energy journal',
    'Study session tracker with focus score',
    'Habit tracker for sleep, water, and exercise',
  ];

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="dash-sidebar-header">
          <div className="dash-logo">
            <Sparkles size={20} /> TrackOS
          </div>
          <button className="dash-menu-toggle" onClick={() => setSidebarOpen(s => !s)}>
            <Menu size={18} />
          </button>
        </div>

        <nav className="dash-nav">
          <Link to="/" className="dash-nav-link active"><Activity size={16} /> Trackers</Link>
          <Link to="/routines" className="dash-nav-link"><ListTodo size={16} /> Routines</Link>
          <Link to="/templates" className="dash-nav-link"><BookTemplate size={16} /> Templates</Link>
          <Link to="/planners" className="dash-nav-link"><FolderOpen size={16} /> My Planners</Link>
          <Link to="/calendar" className="dash-nav-link"><CalendarDays size={16} /> Calendar</Link>
          <Link to="/chatbot" className="dash-nav-link"><BrainCircuit size={16} /> AI Chat</Link>
        </nav>

        <div className="dash-section-label">Your Trackers</div>
        <div className="dash-tracker-list">
          {trackers.map(t => (
            <div
              key={t._id}
              className={`dash-tracker-item ${selectedTracker?._id === t._id ? 'active' : ''}`}
              onClick={() => handleSelectTracker(t)}
            >
              <Activity size={14} />
              <span>{t.name}</span>
              <button className="dash-item-delete" onClick={(e) => handleDeleteTracker(t._id!, e)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {trackers.length === 0 && <p className="dash-empty-hint">No trackers yet. Generate one with AI!</p>}
        </div>

        <div className="dash-user-footer">
          <div className="dash-user-avatar">{user?.name?.charAt(0)}</div>
          <div className="dash-user-info">
            <span>{user?.name}</span>
          </div>
          <button className="dash-logout-btn" onClick={handleToggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={logout} className="dash-logout-btn" title="Logout"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {/* Mobile header */}
        <header className="dash-mobile-header">
          <button onClick={() => setSidebarOpen(s => !s)} className="dash-menu-toggle-mobile">
            <Menu size={22} />
          </button>
          <span className="dash-mobile-title">TrackOS</span>
          <div />
        </header>

        {/* AI Generator */}
        <div className="dash-ai-section">
          <div className="dash-ai-header">
            <BrainCircuit size={20} />
            <h2>AI Tracker Generator</h2>
          </div>
          <form onSubmit={handleAiGenerate} className="dash-ai-form">
            <div className="dash-ai-input-wrap">
              <Sparkles size={18} className="dash-ai-icon" />
              <input
                type="text"
                placeholder="Describe what you want to track... e.g. 'Marathon training with pace, distance and notes'"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="dash-ai-input"
                disabled={isAiLoading}
              />
            </div>
            <button type="submit" className="dash-ai-btn" disabled={isAiLoading || !aiPrompt.trim()}>
              {isAiLoading ? (
                <><span className="spin">⟳</span> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate with AI</>
              )}
            </button>
          </form>

          {!aiDraft && !isAiLoading && (
            <div className="dash-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="dash-suggestion-chip" onClick={() => setAiPrompt(s)}>
                  {s} <ChevronRight size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Access Cards */}
        {!aiDraft && !isAiLoading && (
          <div className="dash-quick-access">
            <div className="dash-quick-access-title">Quick Access</div>
            <div className="dash-quick-cards">
              <button className="dash-quick-card templates" onClick={() => navigate('/templates')}>
                <span className="dash-quick-card-icon"><BookTemplate size={22} /></span>
                <div className="dash-quick-card-body">
                  <span className="dash-quick-card-name">Template Library</span>
                  <span className="dash-quick-card-desc">10 ready-made planner templates</span>
                </div>
                <ChevronRight size={16} className="dash-quick-card-arrow" />
              </button>
              <button className="dash-quick-card planners" onClick={() => navigate('/planners')}>
                <span className="dash-quick-card-icon"><FolderOpen size={22} /></span>
                <div className="dash-quick-card-body">
                  <span className="dash-quick-card-name">My Planners</span>
                  <span className="dash-quick-card-desc">Create and manage planners</span>
                </div>
                <ChevronRight size={16} className="dash-quick-card-arrow" />
              </button>
              <button className="dash-quick-card calendar" onClick={() => navigate('/calendar')}>
                <span className="dash-quick-card-icon"><CalendarDays size={22} /></span>
                <div className="dash-quick-card-body">
                  <span className="dash-quick-card-name">Calendar</span>
                  <span className="dash-quick-card-desc">View planners by date</span>
                </div>
                <ChevronRight size={16} className="dash-quick-card-arrow" />
              </button>
            </div>
          </div>
        )}

        {/* AI Draft Review — Human Approval Step */}
        {aiDraft && editDraft && (
          <div className="dash-draft-card">
            <div className="dash-draft-header">
              <div>
                <h3>✨ AI Generated — Review & Edit Before Saving</h3>
                <p>The AI created this tracker schema. Edit any field, then approve to save it.</p>
              </div>
              <div className="dash-draft-actions">
                <button className="dash-btn-edit" onClick={() => setIsEditingDraft(e => !e)}>
                  <Edit2 size={15} /> {isEditingDraft ? 'Preview' : 'Edit Fields'}
                </button>
                <button className="dash-btn-approve" onClick={handleApproveAndSave}>
                  <CheckCircle size={15} /> Approve & Save
                </button>
                <button className="dash-btn-discard" onClick={() => { setAiDraft(null); setEditDraft(null); }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="dash-draft-meta">
              {isEditingDraft ? (
                <input className="dash-draft-input" value={editDraft.name} onChange={e => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="Tracker name" />
              ) : <h4>{editDraft.name}</h4>}
              {isEditingDraft ? (
                <textarea className="dash-draft-textarea" value={editDraft.description} onChange={e => setEditDraft({ ...editDraft, description: e.target.value })} placeholder="Description" rows={2} />
              ) : <p>{editDraft.description}</p>}
            </div>

            <div className="dash-draft-fields">
              {editDraft.fields.map((field, idx) => (
                <div key={idx} className="dash-draft-field-row">
                  {isEditingDraft ? (
                    <>
                      <input className="dash-field-input" value={field.label} onChange={e => updateDraftField(idx, 'label', e.target.value)} placeholder="Field label" />
                      <select className="dash-field-select" value={field.type} onChange={e => updateDraftField(idx, 'type', e.target.value)}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes/No</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                      </select>
                      <label className="dash-field-required">
                        <input type="checkbox" checked={field.required} onChange={e => updateDraftField(idx, 'required', e.target.checked)} />
                        Required
                      </label>
                      <button className="dash-field-remove" onClick={() => removeDraftField(idx)}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="dash-field-badge">{field.type}</span>
                      <span className="dash-field-name">{field.label}</span>
                      {field.required && <span className="dash-field-req">Required</span>}
                    </>
                  )}
                </div>
              ))}
              {isEditingDraft && (
                <button className="dash-add-field-btn" onClick={addDraftField}>
                  <Plus size={14} /> Add Field
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected tracker view */}
        {selectedTracker && !aiDraft && (
          <div className="dash-tracker-view">
            <div className="dash-tracker-view-header">
              <div>
                <h2>{selectedTracker.name}</h2>
                <p>{selectedTracker.description}</p>
              </div>
              <span className="dash-category-badge">{selectedTracker.category}</span>
            </div>

            <div className="dash-tracker-body">
              <div className="dash-form-panel">
                <h3><Plus size={16} /> Log New Entry</h3>
                <UniversalForm fields={selectedTracker.fields} onSubmit={handleEntrySubmit} />
              </div>

              <div className="dash-chart-panel">
                <h3><BarChart2 size={16} /> Insights</h3>
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dash-chart-empty">
                    <BarChart2 size={40} />
                    <p>Log more entries with numeric fields to see your progress chart</p>
                  </div>
                )}

                {entries.length > 0 && (
                  <div className="dash-recent-entries">
                    <h4>Recent Entries ({entries.length})</h4>
                    {entries.slice(-5).reverse().map((entry, i) => (
                      <div key={i} className="dash-entry-row">
                        <span className="dash-entry-date">
                          {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {Object.entries(entry.data).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="dash-entry-chip">{k}: {String(v)}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedTracker && !aiDraft && !isAiLoading && (
          <div className="dash-empty-state">
            <Sparkles size={56} />
            <h2>Build Your First Tracker</h2>
            <p>Describe what you want to track above and let AI create a custom tracker for you in seconds.</p>
          </div>
        )}
      </main>
    </div>
  );
};
