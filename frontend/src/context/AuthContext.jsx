import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem('nexus_token') || null);
  const [loading, setLoading] = useState(true);

  /* Restore user from storage on mount */
  useEffect(() => {
    if (token) {
      const stored = localStorage.getItem('nexus_user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
    }
    setLoading(false);
  }, []); // run once on mount

  /* setToken: called by Auth page after successful API response */
  const setToken = useCallback((newToken, userData) => {
    setTokenState(newToken);
    localStorage.setItem('nexus_token', newToken);

    // If the Auth page passes userData along with the token
    if (userData) {
      setUser(userData);
      localStorage.setItem('nexus_user', JSON.stringify(userData));
    } else {
      // Try to decode basic JWT payload for display name / email
      try {
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        const decoded = { id: payload.id, displayName: payload.displayName || payload.email, email: payload.email };
        setUser(decoded);
        localStorage.setItem('nexus_user', JSON.stringify(decoded));
      } catch {}
    }
  }, []);

  const login = useCallback((newToken, userData) => {
    setToken(newToken, userData);
  }, [setToken]);

  const logout = useCallback(() => {
    setTokenState(null);
    setUser(null);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, setToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
