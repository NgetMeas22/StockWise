'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, role, permissions } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully! Keep your credentials secure.');
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    },
    onError: (err: any) => {
      setPasswordError(err.message || 'Failed to update password.');
      setPasswordSuccess(null);
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError('New password must be at least 12 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('New password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('New password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('New password must contain at least one number');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError('New password must contain at least one special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const getRoleBadge = (roleName?: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <Badge variant="danger">ADMIN</Badge>;
      case 'MANAGER':
        return <Badge variant="warning">MANAGER</Badge>;
      case 'INVENTORY_STAFF':
        return <Badge variant="info">INVENTORY_STAFF</Badge>;
      case 'VIEWER':
      default:
        return <Badge variant="neutral">VIEWER</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Account & Security</h1>
        <p className="text-sm text-text-muted mt-1">
          Review your profile details, system credentials, and active role permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Assigned Privileges */}
        <div className="md:col-span-1 space-y-6">
          {/* Identity Card */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/20 text-accent flex items-center justify-center font-bold text-xl mx-auto">
              {user?.fullName?.charAt(0) || 'U'}
            </div>

            <div>
              <h2 className="text-base font-bold text-text">{user?.fullName || 'User'}</h2>
              <p className="text-xs font-mono text-text-muted">{user?.email}</p>
              <div className="mt-2">{getRoleBadge(role || undefined)}</div>
            </div>

            <div className="pt-4 border-t border-border text-left text-xs space-y-2 text-text-muted">
              <div>
                <span className="block text-[10px] uppercase font-semibold">User ID</span>
                <span className="font-mono text-text break-all">{user?.id}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold">Status</span>
                <span className="text-emerald-700 font-medium">Active Account</span>
              </div>
            </div>
          </div>

          {/* Role Permissions Box */}
          <div className="bg-surface rounded-[8px] border border-border p-5 shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Granted Privileges ({permissions.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-1 max-h-60 overflow-y-auto">
              {permissions.map((p) => (
                <span
                  key={p}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Change Password Form */}
        <div className="md:col-span-2">
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <KeyRound className="w-5 h-5 text-accent" />
              <div>
                <h2 className="text-base font-semibold text-text">Change Account Password</h2>
                <p className="text-xs text-text-muted">
                  Update your credentials using Argon2id high-grade key derivation.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[6px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-danger text-xs rounded-[6px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <FormField label="Current Password" required>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </FormField>

              <FormField
                label="New Password"
                required
                hint="At least 12 characters, with uppercase, lowercase, number, and special character"
              >
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong new password"
                  required
                />
              </FormField>

              <FormField label="Confirm New Password" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </FormField>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  isLoading={changePasswordMutation.isPending}
                >
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

