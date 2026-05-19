import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--t3)' }}>
          nexus · loading
        </p>
      </div>
    );
  }
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/auth"    element={<Auth />} />
        <Route path="/lobby"   element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/room/:id" element={<ProtectedRoute><Room /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
