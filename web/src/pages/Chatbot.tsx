import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Activity, ListTodo, BrainCircuit, Send, Bot, Plus,
  MessageSquare, Trash2, Menu, X, CheckCircle, Sun, Moon,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredTheme, toggleTheme as doToggle, type Theme } from '../utils/theme';
import './Chatbot.css';

interface ChatMsg {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  executedAction?: string;
  createdAt?: string;
}

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

export const Chatbot: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleTheme = () => {
    const next = doToggle();
    setTheme(next);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const selectConversation = async (id: string) => {
    setCurrentConvId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
    try {
      const res = await api.get(`/chat/conversations/${id}/messages`);
      if (res.data.success) setMessages(res.data.data);
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post('/chat/conversations', { title: 'New Chat' });
      if (res.data.success) {
        const newConv = res.data.data;
        setConversations(prev => [newConv, ...prev]);
        setCurrentConvId(newConv._id);
        setMessages([]);
        if (window.innerWidth < 768) setSidebarOpen(false);
      }
    } catch (e) {
      console.error('Failed to create conversation', e);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentConvId === id) {
        setCurrentConvId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');

    // If no conversation, create one first
    let convId = currentConvId;
    if (!convId) {
      try {
        const res = await api.post('/chat/conversations', { title: userContent.substring(0, 40) });
        if (res.data.success) {
          convId = res.data.data._id;
          setCurrentConvId(convId);
          setConversations(prev => [res.data.data, ...prev]);
        }
      } catch (e) {
        console.error('Failed to create conversation', e);
        return;
      }
    }

    // Optimistic user message
    const tempMsg: ChatMsg = { role: 'user', content: userContent, _id: 'temp-' + Date.now() };
    setMessages(prev => [...prev, tempMsg]);
    setIsLoading(true);

    try {
      const res = await api.post(`/chat/conversations/${convId}/messages`, { content: userContent });
      if (res.data.success) {
        const { userMessage, assistantMessage } = res.data.data;
        setMessages(prev => [
          ...prev.filter(m => m._id !== tempMsg._id),
          userMessage,
          assistantMessage,
        ]);
        // Update conversation list with new title/time
        fetchConversations();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message || 'AI is unavailable';
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${errMsg}. Please try again in a moment.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const SUGGESTIONS = [
    'Create a morning productivity routine for a developer',
    'Build a 2-hour focused study timetable',
    'What tasks should I prioritize today?',
    'Generate a daily workout and wellness schedule',
  ];

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-top">
          <button className="new-chat-btn" onClick={handleNewChat} id="new-chat-btn">
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="sidebar-nav-links">
          <Link to="/" className="sidebar-mode-link">
            <Activity size={16} /> Trackers
          </Link>
          <Link to="/routines" className="sidebar-mode-link">
            <ListTodo size={16} /> Routines
          </Link>
          <Link to="/chatbot" className="sidebar-mode-link active">
            <BrainCircuit size={16} /> AI Chat
          </Link>
        </div>

        <div className="sidebar-conversations">
          <p className="sidebar-section-label">Recent Conversations</p>
          {conversations.length === 0 && (
            <p className="sidebar-empty">No conversations yet</p>
          )}
          {conversations.map(conv => (
            <div
              key={conv._id}
              className={`conv-item ${currentConvId === conv._id ? 'active' : ''}`}
              onClick={() => selectConversation(conv._id)}
            >
              <MessageSquare size={14} />
              <span className="conv-title">{conv.title}</span>
              <button
                className="conv-delete"
                onClick={(e) => handleDeleteConversation(e, conv._id)}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="theme-btn" onClick={handleToggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main chat */}
      <main className="chat-main">
        {/* Mobile header */}
        <header className="chat-mobile-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(s => !s)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="chat-title-logo">TrackOS AI</span>
          <div />
        </header>

        {/* Messages area */}
        <div className="chat-messages">
          {messages.length === 0 && !isLoading ? (
            <div className="chat-empty-state">
              <div className="chat-logo-hero">
                <Sparkles size={48} />
                <h1>TrackOS AI</h1>
                <p>Your intelligent productivity assistant. Ask me to create routines, track goals, or manage your workflow.</p>
              </div>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-pill" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((msg, idx) => (
                <div key={msg._id || idx} className={`message-row ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="avatar-icon"><Bot size={18} /></div>
                  )}
                  <div className={`message-bubble ${msg.role}`}>
                    <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                    {msg.executedAction && (
                      <div className="action-badge">
                        <CheckCircle size={14} /> {msg.executedAction}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-row assistant">
                  <div className="avatar-icon"><Bot size={18} /></div>
                  <div className="message-bubble assistant">
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="chat-input-wrapper">
          <form className="chat-input-form" onSubmit={handleSend}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              placeholder="Message TrackOS AI... (Shift+Enter for new line)"
              className="chat-textarea"
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
          <p className="chat-disclaimer">TrackOS AI can make mistakes. Double check important information.</p>
        </div>
      </main>
    </div>
  );
};
