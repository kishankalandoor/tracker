import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bell, BellOff, CalendarDays, Check, CheckSquare,
  ChevronDown, ChevronUp, Circle, FilePlus2, Loader2,
  Plus, Redo2, StickyNote, Trash2, Type, Undo2, X, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import type { Planner, PlannerBlock } from '../types';
import { Sidebar } from '../components/Sidebar';
import './PlannerEditor.css';

// ─── Utility ─────────────────────────────────────────────────────────────────

function uid() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

// ─── Block Renderers ──────────────────────────────────────────────────────────

interface BlockProps {
  block: PlannerBlock;
  onChange: (updated: PlannerBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TextBlock: React.FC<BlockProps> = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => (
  <div className="pe-block pe-block-text">
    <div className="pe-block-controls">
      <button className="pe-block-ctrl" onClick={onMoveUp} disabled={isFirst} title="Move up"><ChevronUp size={13} /></button>
      <button className="pe-block-ctrl" onClick={onMoveDown} disabled={isLast} title="Move down"><ChevronDown size={13} /></button>
      <button className="pe-block-ctrl danger" onClick={onDelete} title="Delete"><Trash2 size={13} /></button>
    </div>
    <div className="pe-block-icon"><Type size={14} /></div>
    <textarea
      className="pe-text-area"
      placeholder="Write something..."
      value={block.data.content || ''}
      onChange={e => onChange({ ...block, data: { content: e.target.value } })}
      rows={3}
    />
  </div>
);

const NoteBlock: React.FC<BlockProps> = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => (
  <div className="pe-block pe-block-note">
    <div className="pe-block-controls">
      <button className="pe-block-ctrl" onClick={onMoveUp} disabled={isFirst} title="Move up"><ChevronUp size={13} /></button>
      <button className="pe-block-ctrl" onClick={onMoveDown} disabled={isLast} title="Move down"><ChevronDown size={13} /></button>
      <button className="pe-block-ctrl danger" onClick={onDelete} title="Delete"><Trash2 size={13} /></button>
    </div>
    <div className="pe-block-icon"><StickyNote size={14} /></div>
    <textarea
      className="pe-note-area"
      placeholder="Add a note or highlight..."
      value={block.data.content || ''}
      onChange={e => onChange({ ...block, data: { content: e.target.value } })}
      rows={2}
    />
  </div>
);

const TaskBlock: React.FC<BlockProps> = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const tasks: { text: string; isCompleted: boolean }[] = block.data.tasks || [];

  const updateTask = (idx: number, patch: Partial<{ text: string; isCompleted: boolean }>) => {
    const updated = tasks.map((t, i) => i === idx ? { ...t, ...patch } : t);
    onChange({ ...block, data: { tasks: updated } });
  };

  const addTask = () => {
    onChange({ ...block, data: { tasks: [...tasks, { text: '', isCompleted: false }] } });
  };

  const removeTask = (idx: number) => {
    onChange({ ...block, data: { tasks: tasks.filter((_, i) => i !== idx) } });
  };

  const done = tasks.filter(t => t.isCompleted).length;

  return (
    <div className="pe-block pe-block-task">
      <div className="pe-block-controls">
        <button className="pe-block-ctrl" onClick={onMoveUp} disabled={isFirst}><ChevronUp size={13} /></button>
        <button className="pe-block-ctrl" onClick={onMoveDown} disabled={isLast}><ChevronDown size={13} /></button>
        <button className="pe-block-ctrl danger" onClick={onDelete}><Trash2 size={13} /></button>
      </div>
      <div className="pe-block-icon"><CheckSquare size={14} /></div>
      <div className="pe-task-body">
        <div className="pe-task-progress-row">
          <span className="pe-task-label">Tasks</span>
          <span className="pe-task-count">{done}/{tasks.length}</span>
        </div>
        {tasks.length > 0 && (
          <div className="pe-task-progress-bar">
            <div className="pe-task-progress-fill" style={{ width: tasks.length > 0 ? `${(done / tasks.length) * 100}%` : '0%' }} />
          </div>
        )}
        <div className="pe-task-list">
          {tasks.map((task, idx) => (
            <div key={idx} className={`pe-task-item ${task.isCompleted ? 'completed' : ''}`}>
              <button
                className={`pe-task-check ${task.isCompleted ? 'checked' : ''}`}
                onClick={() => updateTask(idx, { isCompleted: !task.isCompleted })}
              >
                {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <input
                className="pe-task-input"
                placeholder="Task description..."
                value={task.text}
                onChange={e => updateTask(idx, { text: e.target.value })}
              />
              <button className="pe-task-remove" onClick={() => removeTask(idx)}><X size={12} /></button>
            </div>
          ))}
        </div>
        <button className="pe-task-add" onClick={addTask}><Plus size={13} /> Add task</button>
      </div>
    </div>
  );
};

const ChecklistBlock: React.FC<BlockProps> = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const items: { text: string; isCompleted: boolean }[] = block.data.items || [];

  const updateItem = (idx: number, patch: Partial<{ text: string; isCompleted: boolean }>) => {
    const updated = items.map((t, i) => i === idx ? { ...t, ...patch } : t);
    onChange({ ...block, data: { items: updated } });
  };

  const addItem = () => {
    onChange({ ...block, data: { items: [...items, { text: '', isCompleted: false }] } });
  };

  const removeItem = (idx: number) => {
    onChange({ ...block, data: { items: items.filter((_, i) => i !== idx) } });
  };

  return (
    <div className="pe-block pe-block-checklist">
      <div className="pe-block-controls">
        <button className="pe-block-ctrl" onClick={onMoveUp} disabled={isFirst}><ChevronUp size={13} /></button>
        <button className="pe-block-ctrl" onClick={onMoveDown} disabled={isLast}><ChevronDown size={13} /></button>
        <button className="pe-block-ctrl danger" onClick={onDelete}><Trash2 size={13} /></button>
      </div>
      <div className="pe-block-icon"><Check size={14} /></div>
      <div className="pe-checklist-body">
        <span className="pe-task-label">Checklist</span>
        <div className="pe-checklist-list">
          {items.map((item, idx) => (
            <div key={idx} className={`pe-checklist-item ${item.isCompleted ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={e => updateItem(idx, { isCompleted: e.target.checked })}
                className="pe-checklist-checkbox"
              />
              <input
                className="pe-checklist-input"
                placeholder="Checklist item..."
                value={item.text}
                onChange={e => updateItem(idx, { text: e.target.value })}
              />
              <button className="pe-task-remove" onClick={() => removeItem(idx)}><X size={12} /></button>
            </div>
          ))}
        </div>
        <button className="pe-task-add" onClick={addItem}><Plus size={13} /> Add item</button>
      </div>
    </div>
  );
};

// ─── Main Editor ──────────────────────────────────────────────────────────────

export const PlannerEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [planner, setPlanner] = useState<Planner | null>(null);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [blocks, setBlocks] = useState<PlannerBlock[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [loading, setLoading] = useState(true);

  // Reminder panel
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [savingReminder, setSavingReminder] = useState(false);

  // Undo/redo stack
  const history = useRef<PlannerBlock[][]>([]);
  const historyIdx = useRef(-1);
  const skipHistory = useRef(false);

  const pushHistory = useCallback((newBlocks: PlannerBlock[]) => {
    if (skipHistory.current) return;
    // Truncate forward history
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push(JSON.parse(JSON.stringify(newBlocks)));
    historyIdx.current = history.current.length - 1;
  }, []);

  const undo = () => {
    if (historyIdx.current <= 0) return;
    historyIdx.current--;
    skipHistory.current = true;
    setBlocks(JSON.parse(JSON.stringify(history.current[historyIdx.current])));
    skipHistory.current = false;
    setSaveStatus('unsaved');
  };

  const redo = () => {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current++;
    skipHistory.current = true;
    setBlocks(JSON.parse(JSON.stringify(history.current[historyIdx.current])));
    skipHistory.current = false;
    setSaveStatus('unsaved');
  };

  // ── Load planner ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/planners/${id}`);
        if (res.data.success) {
          const p: Planner = res.data.data;
          setPlanner(p);
          setTitle(p.title);
          setEmoji(p.emoji);
          setIsCompleted(p.isCompleted);
          setBlocks(p.content.blocks);
          setReminderNote(p.reminderNote || '');
          if (p.reminderAt) {
            const d = new Date(p.reminderAt);
            setReminderDate(d.toISOString().slice(0, 16));
          }
          // Init history
          history.current = [JSON.parse(JSON.stringify(p.content.blocks))];
          historyIdx.current = 0;
        }
      } catch {
        navigate('/planners');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Auto-save (debounced 2s) ────────────────────────────────────────────────

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutoSave = useCallback((newBlocks: PlannerBlock[], newTitle: string, newEmoji: string, newCompleted: boolean) => {
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!id) return;
      setSaveStatus('saving');
      try {
        await api.put(`/planners/${id}`, {
          title: newTitle,
          emoji: newEmoji,
          content: { blocks: newBlocks },
          isCompleted: newCompleted,
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 2000);
  }, [id]);

  // ── Block operations ────────────────────────────────────────────────────────

  const updateBlocks = (newBlocks: PlannerBlock[]) => {
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    triggerAutoSave(newBlocks, title, emoji, isCompleted);
  };

  const updateBlock = (idx: number, updated: PlannerBlock) => {
    const newBlocks = blocks.map((b, i) => i === idx ? updated : b);
    updateBlocks(newBlocks);
  };

  const deleteBlock = (idx: number) => {
    updateBlocks(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[target]] = [newBlocks[target], newBlocks[idx]];
    updateBlocks(newBlocks);
  };

  const addBlock = (type: PlannerBlock['type']) => {
    const newBlock: PlannerBlock = {
      id: uid(),
      type,
      data: type === 'task' ? { tasks: [] }
        : type === 'checklist' ? { items: [] }
        : { content: '' },
    };
    updateBlocks([...blocks, newBlock]);
  };

  // ── Title / Emoji changes ──────────────────────────────────────────────────

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutoSave(blocks, val, emoji, isCompleted);
  };

  const handleEmojiChange = (val: string) => {
    setEmoji(val);
    triggerAutoSave(blocks, title, val, isCompleted);
  };

  const handleToggleComplete = () => {
    const next = !isCompleted;
    setIsCompleted(next);
    triggerAutoSave(blocks, title, emoji, next);
  };

  // ── Reminder ────────────────────────────────────────────────────────────────

  const handleSaveReminder = async () => {
    if (!reminderDate || !id) return;
    setSavingReminder(true);
    try {
      // Create standalone reminder
      await api.post('/reminders', {
        plannerId: id,
        title: reminderNote || title,
        reminderAt: new Date(reminderDate).toISOString(),
      });
      // Also patch planner reminderAt
      await api.put(`/planners/${id}`, {
        reminderAt: new Date(reminderDate).toISOString(),
        reminderNote,
      });
      setSaveStatus('saved');
      setShowReminderPanel(false);
    } catch {
      alert('Failed to set reminder');
    } finally {
      setSavingReminder(false);
    }
  };

  const handleClearReminder = async () => {
    if (!id) return;
    try {
      await api.put(`/planners/${id}`, { reminderAt: null, reminderNote: '' });
      setReminderDate('');
      setReminderNote('');
      setShowReminderPanel(false);
    } catch {
      alert('Failed to clear reminder');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="pe-layout">
        <Sidebar />
        <main className="pe-loading">
          <Loader2 size={36} className="pe-spinner" />
          <p>Loading planner…</p>
        </main>
      </div>
    );
  }

  if (!planner) return null;

  const saveLabel = saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved' ? '✓ Saved'
    : saveStatus === 'error' ? '⚠ Error'
    : '● Unsaved';

  return (
    <div className="pe-layout">
      <Sidebar />
      <main className="pe-main">

        {/* Sticky Header */}
        <header className="pe-header">
          <div className="pe-header-left">
            <button className="pe-back-btn" onClick={() => navigate('/planners')}>
              <ArrowLeft size={18} />
            </button>
            <input
              className="pe-emoji-input"
              value={emoji}
              onChange={e => handleEmojiChange(e.target.value)}
              maxLength={2}
              title="Change emoji"
            />
            <input
              id="planner-title"
              className="pe-title-input"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Planner title..."
            />
          </div>

          <div className="pe-header-right">
            <span className={`pe-save-status ${saveStatus}`}>{saveLabel}</span>

            <button className="pe-header-btn" onClick={undo} title="Undo" disabled={historyIdx.current <= 0}>
              <Undo2 size={16} />
            </button>
            <button className="pe-header-btn" onClick={redo} title="Redo" disabled={historyIdx.current >= history.current.length - 1}>
              <Redo2 size={16} />
            </button>

            <button
              className={`pe-header-btn reminder ${planner.reminderAt ? 'active' : ''}`}
              onClick={() => setShowReminderPanel(s => !s)}
              title="Set reminder"
            >
              {planner.reminderAt ? <Bell size={16} /> : <BellOff size={16} />}
            </button>

            <button
              className="pe-header-btn calendar"
              onClick={() => navigate(`/calendar`)}
              title="Open Calendar"
            >
              <CalendarDays size={16} />
            </button>

            <button
              className={`pe-complete-btn ${isCompleted ? 'done' : ''}`}
              onClick={handleToggleComplete}
            >
              {isCompleted ? <><CheckCircle2 size={15} /> Done</> : <><Circle size={15} /> Mark Done</>}
            </button>
          </div>
        </header>

        {/* Reminder Panel */}
        {showReminderPanel && (
          <div className="pe-reminder-panel">
            <h3><Bell size={15} /> Set Reminder</h3>
            <div className="pe-reminder-fields">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                className="pe-reminder-input"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <label>Note (optional)</label>
              <input
                type="text"
                className="pe-reminder-input"
                placeholder="e.g. Review and submit"
                value={reminderNote}
                onChange={e => setReminderNote(e.target.value)}
              />
            </div>
            <div className="pe-reminder-actions">
              <button
                className="pe-reminder-save-btn"
                onClick={handleSaveReminder}
                disabled={!reminderDate || savingReminder}
              >
                {savingReminder ? <Loader2 size={14} className="pe-spinner-sm" /> : <Bell size={14} />}
                Save Reminder
              </button>
              {planner.reminderAt && (
                <button className="pe-reminder-clear-btn" onClick={handleClearReminder}>
                  <BellOff size={14} /> Clear
                </button>
              )}
              <button className="pe-reminder-cancel-btn" onClick={() => setShowReminderPanel(false)}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Content Blocks */}
        <div className="pe-blocks">
          {blocks.length === 0 && (
            <div className="pe-empty-blocks">
              <FilePlus2 size={48} />
              <p>Add your first block below to start planning.</p>
            </div>
          )}

          {blocks.map((block, idx) => {
            const props: BlockProps = {
              block,
              onChange: (updated) => updateBlock(idx, updated),
              onDelete: () => deleteBlock(idx),
              onMoveUp: () => moveBlock(idx, 'up'),
              onMoveDown: () => moveBlock(idx, 'down'),
              isFirst: idx === 0,
              isLast: idx === blocks.length - 1,
            };

            if (block.type === 'text') return <TextBlock key={block.id} {...props} />;
            if (block.type === 'note') return <NoteBlock key={block.id} {...props} />;
            if (block.type === 'task') return <TaskBlock key={block.id} {...props} />;
            if (block.type === 'checklist') return <ChecklistBlock key={block.id} {...props} />;
            return null;
          })}
        </div>

        {/* Add Block Toolbar */}
        <div className="pe-toolbar">
          <span className="pe-toolbar-label">Add block</span>
          <button className="pe-toolbar-btn text" onClick={() => addBlock('text')}>
            <Type size={15} /> Text
          </button>
          <button className="pe-toolbar-btn task" onClick={() => addBlock('task')}>
            <CheckSquare size={15} /> Task List
          </button>
          <button className="pe-toolbar-btn checklist" onClick={() => addBlock('checklist')}>
            <Check size={15} /> Checklist
          </button>
          <button className="pe-toolbar-btn note" onClick={() => addBlock('note')}>
            <StickyNote size={15} /> Note
          </button>
        </div>
      </main>
    </div>
  );
};
