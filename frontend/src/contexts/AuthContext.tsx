import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, AUTH_ERROR_EVENT, CONNECTION_ERROR_EVENT } from '../services/api';
import type { User, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 認証エラー・接続エラーイベントをリッスンしてログインページへリダイレクトする
  useEffect(() => {
    const handleAuthError = () => {
      setUser(null);
      navigate('/login');
    };

    const handleConnectionError = () => {
      setUser(null);
      navigate('/login');
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    window.addEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);

    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
      window.removeEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
    };
  }, [navigate]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
