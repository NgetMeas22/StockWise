'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setCsrfToken } from './api-client';
import { PermissionKey, RoleKey, UserDTO } from '@stockwise/shared';

interface AuthContextValue {
  user: UserDTO | null;
  role: RoleKey | null;
  permissions: PermissionKey[];
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: PermissionKey | PermissionKey[]) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [role, setRole] = useState<RoleKey | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = async () => {
    try {
      const res = await apiRequest<{
        user: UserDTO;
        role: RoleKey;
        permissions: PermissionKey[];
      }>('/auth/me');

      setUser(res.data.user);
      setRole(res.data.role);
      setPermissions(res.data.permissions || []);
    } catch {
      setUser(null);
      setRole(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest<{
      user: UserDTO;
      role: RoleKey;
      permissions: PermissionKey[];
      csrfToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    setUser(res.data.user);
    setRole(res.data.role);
    setPermissions(res.data.permissions || []);
    setCsrfToken(res.data.csrfToken);

    if (res.data.user.mustChangePassword) {
      router.push('/app/profile?mustChange=true');
    } else {
      router.push('/app/dashboard');
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setCsrfToken(null);
      router.push('/login');
    }
  };

  const checkPermission = (required: PermissionKey | PermissionKey[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    if (Array.isArray(required)) {
      return required.every((k) => permissions.includes(k));
    }
    return permissions.includes(required);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isLoading,
        login,
        logout,
        hasPermission: checkPermission,
        refetchUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

