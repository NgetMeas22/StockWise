'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { PermissionKey } from '@stockwise/shared';

interface CanProps {
  permission: PermissionKey | PermissionKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

export function usePermission(permission: PermissionKey | PermissionKey[]): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

