export const AUTH_MODE_KEY = 'authMode';
export const AUTH_MODES = {
  UNSAFE: 'unsafe',
  PROTECTED: 'protected',
};

const UNSAFE_ACCESS_TOKEN_KEY = 'unsafe.accessToken';
const UNSAFE_REFRESH_TOKEN_KEY = 'unsafe.refreshToken';
const UNSAFE_USERNAME_KEY = 'unsafe.username';
const UNSAFE_ROLE_KEY = 'unsafe.role';
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';

let protectedAccessToken = null;

export const getAuthMode = () => {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  return mode === AUTH_MODES.UNSAFE ? AUTH_MODES.UNSAFE : AUTH_MODES.PROTECTED;
};

export const setAuthMode = (mode) => {
  const nextMode = mode === AUTH_MODES.UNSAFE ? AUTH_MODES.UNSAFE : AUTH_MODES.PROTECTED;
  localStorage.setItem(AUTH_MODE_KEY, nextMode);
  return nextMode;
};

export const getAccessToken = () => protectedAccessToken;

export const setAccessToken = (token) => {
  protectedAccessToken = token || null;
};

export const clearAccessToken = () => {
  protectedAccessToken = null;
};

export const getUnsafeAccessToken = () => localStorage.getItem(UNSAFE_ACCESS_TOKEN_KEY);

export const getUnsafeRefreshToken = () => localStorage.getItem(UNSAFE_REFRESH_TOKEN_KEY);

export const setUnsafeSession = ({ accessToken, refreshToken, username, role }) => {
  if (accessToken) localStorage.setItem(UNSAFE_ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(UNSAFE_REFRESH_TOKEN_KEY, refreshToken);
  if (username) localStorage.setItem(UNSAFE_USERNAME_KEY, username);
  if (role) localStorage.setItem(UNSAFE_ROLE_KEY, role);
};

export const getUnsafeUser = () => {
  const username = localStorage.getItem(UNSAFE_USERNAME_KEY);
  const role = localStorage.getItem(UNSAFE_ROLE_KEY);
  return username ? { username, role } : null;
};

export const clearUnsafeSession = () => {
  localStorage.removeItem(UNSAFE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(UNSAFE_REFRESH_TOKEN_KEY);
  localStorage.removeItem(UNSAFE_USERNAME_KEY);
  localStorage.removeItem(UNSAFE_ROLE_KEY);
};

export const clearLegacyTokens = () => {
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
};

export const clearAuthState = () => {
  clearAccessToken();
  clearUnsafeSession();
  clearLegacyTokens();
};

export const getDisplayToken = (token) => {
  if (!token) return 'Nije dostupan';
  if (token.length <= 18) return token;
  return `${token.slice(0, 10)}...${token.slice(-8)}`;
};
