import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('govassist_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('govassist_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('govassist_token');
      if (savedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('govassist_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('govassist_token', data.access_token);
    localStorage.setItem('govassist_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('govassist_token', data.access_token);
    localStorage.setItem('govassist_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('govassist_token');
    localStorage.removeItem('govassist_user');
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('govassist_user', JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
