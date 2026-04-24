import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const payload = parseToken(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('access_token');
      return null;
    }
    return { token, role: payload.role, permissions: payload.permissions ?? [], email: payload.email, sub: payload.sub };
  });

  const login = useCallback((token) => {
    const payload = parseToken(token);
    localStorage.setItem('access_token', token);
    setAuth({ token, role: payload.role, permissions: payload.permissions ?? [], email: payload.email, sub: payload.sub });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
