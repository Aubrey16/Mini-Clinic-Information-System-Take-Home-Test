import { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

const roleLabels = {
  administration: 'Administrator',
  doctor: 'Dokter',
  registration_officer: 'Petugas Pendaftaran',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }

  async function logout() {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }

  const value = { user, login, logout, roleLabel: user ? roleLabels[user.role] : '' };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
