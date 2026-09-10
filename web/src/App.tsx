import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Routines } from './pages/Routines';
import { Chatbot } from './pages/Chatbot';
import { Templates } from './pages/Templates';
import { Planners } from './pages/Planners';
import { PlannerEditor } from './pages/PlannerEditor';
import { CalendarView } from './pages/CalendarView';
import { ReminderBell } from './components/ReminderBell';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      {/* Global reminder bell — polls every 60s when logged in */}
      <ReminderBell />

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard / Trackers */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Routines */}
        <Route
          path="/routines"
          element={
            <PrivateRoute>
              <Routines />
            </PrivateRoute>
          }
        />

        {/* AI Chatbot */}
        <Route
          path="/chatbot"
          element={
            <PrivateRoute>
              <Chatbot />
            </PrivateRoute>
          }
        />

        {/* Template Library */}
        <Route
          path="/templates"
          element={
            <PrivateRoute>
              <Templates />
            </PrivateRoute>
          }
        />

        {/* My Planners */}
        <Route
          path="/planners"
          element={
            <PrivateRoute>
              <Planners />
            </PrivateRoute>
          }
        />

        {/* Planner Editor */}
        <Route
          path="/planners/:id"
          element={
            <PrivateRoute>
              <PlannerEditor />
            </PrivateRoute>
          }
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarView />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
