import { createContext, useState, useEffect, useCallback } from 'react';
import { authRegister, authLogin, authGetMe } from '../api/auth';
import { clearAllAuthData, getToken, setToken, setUser } from '../utils/storage';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = getToken();

      if (!savedToken) {
        clearAllAuthData();
        setLoading(false);
        return;
      }

      try {
        setTokenState(savedToken);
        const res = await authGetMe();
        setUser(res.data);
        setUserState(res.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAllAuthData();
        setTokenState(null);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = useCallback(async (email, password, phone, name) => {
    try {
      const res = await authRegister(email, password, phone, name);
      const { token, user } = res.data;

      setToken(token);
      setUser(user);
      setTokenState(token);
      setUserState(user);

      return { success: true, user };
    } catch (error) {
      throw error;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authLogin(email, password);
      const { token, user } = res.data;

      setToken(token);
      setUser(user);
      setTokenState(token);
      setUserState(user);

      return { success: true, user };
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearAllAuthData();
    setTokenState(null);
    setUserState(null);
  }, []);

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isPatient,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
