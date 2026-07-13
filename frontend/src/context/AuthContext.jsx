import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import {
  AUTH_MODES,
  clearAccessToken,
  clearAuthState,
  clearLegacyTokens,
  clearUnsafeSession,
  getAuthMode,
  getUnsafeRefreshToken,
  getUnsafeUser,
  setAccessToken,
  setAuthMode as persistAuthMode,
  setUnsafeSession,
} from '../api/tokenStore';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [authMode, setAuthModeState] = useState(getAuthMode());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      clearLegacyTokens();
      const mode = getAuthMode();
      setAuthModeState(mode);

      if (mode === AUTH_MODES.UNSAFE) {
        setUser(getUnsafeUser());
        setLoading(false);
        return;
      }

      clearUnsafeSession();

      try {
        const refreshResponse = await api.post(
          '/api/protected/auth/refresh',
          {},
          { withCredentials: true, skipAuthRefresh: true }
        );
        setAccessToken(refreshResponse.data.accessToken);

        const profileResponse = await api.get('/api/protected/profile');
        setUser({
          username: profileResponse.data.username,
          role: profileResponse.data.roles,
        });
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const changeAuthMode = async (mode) => {
    const nextMode = persistAuthMode(mode);

    try {
      if (authMode === AUTH_MODES.UNSAFE && getUnsafeRefreshToken()) {
        await api.post('/api/unsafe/auth/logout', { refreshToken: getUnsafeRefreshToken() });
      } else if (authMode === AUTH_MODES.PROTECTED) {
        await api.post('/api/protected/auth/logout', {}, { withCredentials: true, skipAuthRefresh: true });
      }
    } catch {
      // Promena rezima ne sme ostaviti korisnika zaglavljenog ako logout nije moguc.
    } finally {
      clearAuthState();
      persistAuthMode(nextMode);
      setAuthModeState(nextMode);
      setUser(null);
    }
  };

  const login = async (username, password) => {
    if (authMode === AUTH_MODES.UNSAFE) {
      const response = await api.post('/api/unsafe/auth/login', { username, password });
      const { accessToken, refreshToken, role } = response.data;

      clearAccessToken();
      setUnsafeSession({ accessToken, refreshToken, username, role });
      setUser({ username, role });
      return response.data;
    }

    const response = await api.post(
      '/api/protected/auth/login',
      { username, password },
      { withCredentials: true }
    );
    const { accessToken, role } = response.data;

    clearUnsafeSession();
    setAccessToken(accessToken);
    setUser({ username, role });
    return response.data;
  };

  const register = async (username, email, password) => {
    if (authMode === AUTH_MODES.UNSAFE) {
      const response = await api.post('/api/unsafe/auth/register', {
        username,
        email,
        password,
      });
      const { accessToken, refreshToken, role } = response.data;

      clearAccessToken();
      setUnsafeSession({ accessToken, refreshToken, username, role });
      setUser({ username, role });
      return response.data;
    }

    const response = await api.post(
      '/api/protected/auth/register',
      { username, email, password },
      { withCredentials: true }
    );
    const { accessToken, role } = response.data;

    clearUnsafeSession();
    setAccessToken(accessToken);
    setUser({ username, role });
    return response.data;
  };

  const logout = async () => {
    try {
      if (authMode === AUTH_MODES.UNSAFE) {
        const refreshToken = getUnsafeRefreshToken();
        if (refreshToken) {
          await api.post('/api/unsafe/auth/logout', { refreshToken });
        }
      } else {
        await api.post('/api/protected/auth/logout', {}, { withCredentials: true, skipAuthRefresh: true });
      }
    } finally {
      clearAuthState();
      persistAuthMode(authMode);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authMode,
        changeAuthMode,
        user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
