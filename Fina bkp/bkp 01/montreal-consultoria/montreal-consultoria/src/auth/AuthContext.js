import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = ({ username, password }) => {
    if (username === 'admin' && password === 'admin') {
      const user = { username, role: 'admin' };
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } else if (username === 'user' && password === 'user') {
      const user = { username, role: 'user' };
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } else {
      return { success: false, message: 'Credenciais inválidas' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 