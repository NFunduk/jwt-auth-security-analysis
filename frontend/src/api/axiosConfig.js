import axios from 'axios';
import {
  AUTH_MODES,
  clearAccessToken,
  clearLegacyTokens,
  clearUnsafeSession,
  getAccessToken,
  getAuthMode,
  getUnsafeAccessToken,
  getUnsafeRefreshToken,
  setAccessToken,
  setUnsafeSession,
} from './tokenStore';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let protectedRefreshPromise = null;

export const refreshProtectedSession = () => {
  if (!protectedRefreshPromise) {
    protectedRefreshPromise = axios.post(
      `${API_BASE_URL}/api/protected/auth/refresh`,
      {},
      { withCredentials: true, skipAuthRefresh: true }
    ).finally(() => {
      protectedRefreshPromise = null;
    });
  }

  return protectedRefreshPromise;
};

const isAuthRequest = (url = '') =>
  /\/api\/(unsafe\/auth|protected\/auth|auth)\/(register|login|login-cookie|refresh|logout)$/.test(url);

api.interceptors.request.use(
  (config) => {
    const mode = getAuthMode();
    const url = config.url || '';
    clearLegacyTokens();

    if (mode === AUTH_MODES.UNSAFE) {
      const token = getUnsafeAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (url.includes('/api/protected/auth/')) {
      config.withCredentials = true;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const mode = getAuthMode();

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      isAuthRequest(originalRequest.url || '')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (mode === AUTH_MODES.UNSAFE) {
        const refreshToken = getUnsafeRefreshToken();
        if (!refreshToken) throw new Error('Unsafe refresh token nije dostupan');

        const response = await axios.post(
          `${API_BASE_URL}/api/unsafe/auth/refresh`,
          { refreshToken },
          { skipAuthRefresh: true }
        );

        const { accessToken, refreshToken: nextRefreshToken, username, role } = response.data;
        setUnsafeSession({
          accessToken,
          refreshToken: nextRefreshToken || refreshToken,
          username,
          role,
        });

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }

      const response = await refreshProtectedSession();

      const { accessToken } = response.data;
      setAccessToken(accessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      originalRequest.withCredentials = true;
      return api(originalRequest);
    } catch (refreshError) {
      if (mode === AUTH_MODES.UNSAFE) {
        clearUnsafeSession();
      } else {
        clearAccessToken();
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;
