import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, CheckCircle, Circle, FolderOpen,
  BookTemplate, ArrowRight, X, Loader2
} from 'lucide-react';
import api from '../services/api';
import type { Planner } from '../types';
import { Sidebar } from '../components/Sidebar';
import './Planners.css';

export const Planners: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Auto-open create modal when coming from Templates page
  const templateIdFromQuery = searchParams.get('newFromTemplate');
  const templateNameFromQuery = searchParams.get('name');

  const fetchPlanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/planners');
      if (res.data.success) setPlanners(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanners();
    // Auto-create planner from template if directed from Templates page
    if (templateIdFromQuery) {
      autoCreateFromTemplate(templateIdFromQuery, templateNameFromQuery || 'My Planner');
    }
  }, []);

  const autoCreateFromTemplate = async (templateId: string, name: string) => {
    setCreating(true);
    try {
      const res = await api.post('/planners', {
        title: name,
        templateId,
      });
      if (res.data.success) {
        navigate(`/planners/${res.data.data._id}`);
      }
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const handleCreateBlank = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/planners', { title: newTitle.trim() });
      if (res.data.success) {
        navigate(`/planners/${res.data.data._id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
      setShowNewModal(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this planner?')) return;
    try {
      await api.delete(`/planners/${id}`);
      setPlanners(prev => prev.filter(p => p._id !== id));
    } catch {
      alert('Failed to delete planner');
    }
  };

  const getCompletionPct = (planner: Planner): number => {
    const tasks: any[] = [];
    for (const block of planner.content.blocks) {
      if (block.type === 'task' && Array.isArray(block.data.tasks)) tasks.push(...block.data.tasks);
      if (block.type === 'checklist' && Array.isArray(block.data.items)) tasks.push(...block.data.items);
    }
    if (tasks.length === 0) return planner.isCompleted ? 100 : 0;
    const done = tasks.filter((t: any) => t.isCompleted).length;
    return Math.round((done / tasks.length) * 100);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (creating) {
    return (
      <div className="planners-layout">
        <Sidebar />
        <main className="planners-creating">
          <Loader2 size={36} className="planners-creating-spin" />
          <p>Creating your planner…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="planners-layout">
      <Sidebar />
      <main className="planners-main">
        {/* Header */}
        <div className="planners-header">
          <div>
            <h1 className="planners-title">My Planners</h1>
            <p className="planners-subtitle">{planners.length} planner{planners.length !== 1 ? 's' : ''}</p>
          </div>
          <button id="new-planner-btn" className="planners-new-btn" onClick={() => setShowNewModal(true)}>
            <Plus size={18} /> New Planner
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="planners-loading">
            <div className="planners-spinner" />
            <p>Loading planners…</p>
          </div>
        ) : planners.length === 0 ? (
          <div className="planners-empty">
            <FolderOpen size={56} />
            <h2>No planners yet</h2>
            <p>Start from a template or create a blank planner.</p>
            <div className="planners-empty-actions">
              <button className="planners-empty-btn primary" onClick={() => navigate('/templates')}>
                <BookTemplate size={16} /> Browse Templates
              </button>
              <button className="planners-empty-btn" onClick={() => setShowNewModal(true)}>
                <Plus size={16} /> Blank Planner
              </button>
            </div>
          </div>
        ) : (
          <div className="planners-grid">
            {planners.map(p => {
              const pct = getCompletionPct(p);
              return (
                <div
                  key={p._id}
                  className={`planner-card ${p.isCompleted ? 'completed' : ''}`}
                  onClick={() => navigate(`/planners/${p._id}`)}
                >
                  <div className="planner-card-top">
                    <span className="planner-card-emoji">{p.emoji}</span>
                    <button
                      className="planner-card-delete"
                      onClick={e => handleDelete(p._id, e)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="planner-card-title">{p.title}</h3>
                  {p.description && <p className="planner-card-desc">{p.description}</p>}

                  <div className="planner-card-progress-wrap">
                    <div className="planner-card-progress-bar">
                      <div
                        className="planner-card-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="planner-card-pct">{pct}%</span>
                  </div>

                  <div className="planner-card-footer">
                    <span className="planner-card-date">{formatDate(p.updatedAt)}</span>
                    {p.isCompleted ? (
                      <span className="planner-card-badge done"><CheckCircle size={12} /> Done</span>
                    ) : p.reminderAt ? (
                      <span className="planner-card-badge reminder">⏰ Reminder set</span>
                    ) : (
                      <span className="planner-card-badge open"><Circle size={12} /> Open</span>
                    )}
                    <ArrowRight size={14} className="planner-card-arrow" />
                  </div>
                </div>
              );
            })}

            {/* New planner card */}
            <div className="planner-card planner-card-new" onClick={() => setShowNewModal(true)}>
              <Plus size={32} />
              <p>New Planner</p>
            </div>
          </div>
        )}
      </main>

      {/* New Planner Modal */}
      {showNewModal && (
        <div className="planners-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="planners-modal" onClick={e => e.stopPropagation()}>
            <button className="planners-modal-close" onClick={() => setShowNewModal(false)}>
              <X size={18} />
            </button>
            <h2>New Planner</h2>
            <p>Give your planner a name, or browse templates for a head-start.</p>

            <input
              id="new-planner-title"
              type="text"
              placeholder="e.g. My Daily Plan"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="planners-modal-input"
              onKeyDown={e => e.key === 'Enter' && handleCreateBlank()}
              autoFocus
            />

            <div className="planners-modal-actions">
              <button
                className="planners-modal-btn primary"
                onClick={handleCreateBlank}
                disabled={!newTitle.trim() || creating}
              >
                {creating ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                Create Blank
              </button>
              <button
                className="planners-modal-btn secondary"
                onClick={() => { setShowNewModal(false); navigate('/templates'); }}
              >
                <BookTemplate size={15} /> Browse Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
