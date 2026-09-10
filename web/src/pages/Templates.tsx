import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, X, ArrowRight, Download,
  Sparkles, Tag, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import type { TrackerDefinition } from '../types';
import { Sidebar } from '../components/Sidebar';
import './Templates.css';

const CATEGORIES = ['All', 'Personal', 'Health', 'Fitness', 'Finance', 'Study', 'Work'];

const CATEGORY_EMOJI: Record<string, string> = {
  All: '🌟', Personal: '🌅', Health: '💪',
  Fitness: '🏃', Finance: '💰', Study: '📚', Work: '💼',
};

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TrackerDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<TrackerDefinition | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchTemplates = async (category?: string) => {
    setLoading(true);
    try {
      const params = category && category !== 'All' ? `?category=${category}` : '';
      const res = await api.get(`/trackers/templates${params}`);
      if (res.data.success) setTemplates(res.data.data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    fetchTemplates(cat);
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleUseTemplate = async (template: TrackerDefinition) => {
    setDownloading(template._id);
    try {
      await api.post(`/trackers/templates/${template._id}/download`);
      navigate(`/planners?newFromTemplate=${template._id}&name=${encodeURIComponent(template.name)}`);
    } catch {
      navigate(`/planners?newFromTemplate=${template._id}&name=${encodeURIComponent(template.name)}`);
    } finally {
      setDownloading(null);
      setPreview(null);
    }
  };

  const getTemplateEmoji = (t: TrackerDefinition) => {
    const map: Record<string, string> = {
      Personal: '🌅', Health: '💪', Fitness: '🏃',
      Finance: '💰', Study: '📚', Work: '💼',
    };
    return map[t.category] || '📋';
  };

  return (
    <div className="templates-layout">
      <Sidebar />
      <main className="templates-main">
        {/* Hero */}
        <div className="templates-hero">
          <div className="templates-hero-content">
            <div className="templates-hero-badge">
              <Sparkles size={14} /> Template Library
            </div>
            <h1>Find the Perfect Planner</h1>
            <p>Choose from {templates.length} professionally crafted templates — all served from the database, never hard-coded.</p>
          </div>
          <div className="templates-search-wrap">
            <Search size={18} className="templates-search-icon" />
            <input
              id="template-search"
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="templates-search"
            />
            {search && (
              <button className="templates-search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="templates-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`templates-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat)}
            >
              <span>{CATEGORY_EMOJI[cat]}</span> {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="templates-loading">
            <div className="templates-spinner" />
            <p>Loading templates from database…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="templates-empty">
            <BookOpen size={48} />
            <h3>No templates found</h3>
            <p>{search ? `No results for "${search}"` : 'No templates in this category yet.'}</p>
          </div>
        ) : (
          <div className="templates-grid">
            {filtered.map(t => (
              <div key={t._id} className="template-card" onClick={() => setPreview(t)}>
                <div className="template-card-emoji">{getTemplateEmoji(t)}</div>
                <div className="template-card-body">
                  <div className="template-card-meta">
                    <span className="template-card-category">
                      <Tag size={11} /> {t.category}
                    </span>
                    <span className="template-card-fields">{t.fields.length} fields</span>
                  </div>
                  <h3 className="template-card-name">{t.name}</h3>
                  <p className="template-card-desc">{t.description}</p>
                </div>
                <div className="template-card-footer">
                  <button className="template-card-preview-btn" onClick={e => { e.stopPropagation(); setPreview(t); }}>
                    Preview <ChevronRight size={14} />
                  </button>
                  <button
                    className="template-card-use-btn"
                    onClick={e => { e.stopPropagation(); handleUseTemplate(t); }}
                    disabled={downloading === t._id}
                  >
                    {downloading === t._id ? 'Loading…' : <><ArrowRight size={14} /> Use</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {preview && (
        <div className="templates-modal-overlay" onClick={() => setPreview(null)}>
          <div className="templates-modal" onClick={e => e.stopPropagation()}>
            <button className="templates-modal-close" onClick={() => setPreview(null)}>
              <X size={18} />
            </button>
            <div className="templates-modal-emoji">{getTemplateEmoji(preview)}</div>
            <span className="templates-modal-category">
              <Tag size={12} /> {preview.category}
            </span>
            <h2 className="templates-modal-title">{preview.name}</h2>
            <p className="templates-modal-desc">{preview.description}</p>

            <div className="templates-modal-fields-label">
              Fields ({preview.fields.length})
            </div>
            <div className="templates-modal-fields">
              {preview.fields.map(f => (
                <div key={f.fieldKey} className="templates-modal-field">
                  <span className="templates-modal-field-type">{f.type}</span>
                  <span className="templates-modal-field-label">{f.label}</span>
                  {f.required && <span className="templates-modal-field-req">Required</span>}
                </div>
              ))}
            </div>

            <button
              className="templates-modal-use-btn"
              onClick={() => handleUseTemplate(preview)}
              disabled={downloading === preview._id}
            >
              <Download size={16} />
              {downloading === preview._id ? 'Creating planner…' : 'Use This Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
