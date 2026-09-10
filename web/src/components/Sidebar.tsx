import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, BrainCircuit, ListTodo, Sparkles,
  BookTemplate, FolderOpen, CalendarDays, Menu, LogOut, Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getStoredTheme, toggleTheme as doToggle, type Theme } from '../utils/theme';
import './Sidebar.css';

interface SidebarProps {
  activeLink?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const handleToggleTheme = () => {
    const next = doToggle();
    setTheme(next);
  };

  const navLinks = [
    { to: '/', icon: <Activity size={16} />, label: 'Trackers' },
    { to: '/routines', icon: <ListTodo size={16} />, label: 'Routines' },
    { to: '/templates', icon: <BookTemplate size={16} />, label: 'Templates' },
    { to: '/planners', icon: <FolderOpen size={16} />, label: 'My Planners' },
    { to: '/calendar', icon: <CalendarDays size={16} />, label: 'Calendar' },
    { to: '/chatbot', icon: <BrainCircuit size={16} />, label: 'AI Chat' },
  ];

  return (
    <aside className={`sidebar ${open ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Sparkles size={20} />
          {open && <span>TrackOS</span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setOpen(s => !s)}>
          <Menu size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-nav-link ${location.pathname === link.to ? 'active' : ''}`}
            title={!open ? link.label : undefined}
          >
            {link.icon}
            {open && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{user?.name?.charAt(0)}</div>
        {open && <div className="sidebar-user-name">{user?.name}</div>}
        <button className="sidebar-icon-btn" onClick={handleToggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="sidebar-icon-btn" onClick={logout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
