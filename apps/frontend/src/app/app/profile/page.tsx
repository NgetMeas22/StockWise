'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../lib/toast-context';
import { useTranslation } from '../../../i18n/i18n-context';
import {
  Shield,
  KeyRound,
  AlertCircle,
  Lock,
  Camera,
  Upload,
  Trash2,
  Check,
  Copy,
  CheckCheck,
  Eye,
  EyeOff,
  UserIcon,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Loader2,
  Package,
  Layers,
  Truck,
  ShoppingCart,
  BarChart3,
  Users,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, role, permissions, refetchUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [clinicName] = useState('Khema Digital Dental Solution');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Copy User ID
  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      toast.success('Copied to clipboard', 'User ID copied.');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Update Profile Details Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (body: { fullName: string; email: string; phone?: string | null }) => {
      return apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await refetchUser();
      toast.success('Profile updated', 'Your profile details have been saved successfully.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile.');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Validation error', 'Full name is required.');
      return;
    }
    if (!email.trim()) {
      toast.error('Validation error', 'Email address is required.');
      return;
    }

    updateProfileMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() ? phone.trim() : null,
    });
  };

  // Avatar Upload Mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiRequest('/auth/profile/avatar', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: async () => {
      await refetchUser();
      toast.success('Avatar updated', 'Your new profile photo has been saved.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload photo.');
    },
  });

  // Avatar Remove Mutation
  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/auth/profile/avatar', {
        method: 'DELETE',
      });
    },
    onSuccess: async () => {
      await refetchUser();
      toast.success('Avatar removed', 'Profile photo reset to default.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove avatar.');
    },
  });

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', 'Avatar image must be under 5MB.');
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success(t('toasts.passwordChanged'));
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to update password.';
      setPasswordError(msg);
      toast.error(msg);
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

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

  // Group permissions logically for executive presentation
  const permissionGroups = [
    {
      title: 'Products & Catalog',
      icon: Package,
      items: permissions.filter((p) => p.startsWith('products:')),
    },
    {
      title: 'Categories',
      icon: Layers,
      items: permissions.filter((p) => p.startsWith('categories:')),
    },
    {
      title: 'Inventory & Stock',
      icon: ShieldCheck,
      items: permissions.filter((p) => p.startsWith('inventory:')),
    },
    {
      title: 'Suppliers',
      icon: Truck,
      items: permissions.filter((p) => p.startsWith('suppliers:')),
    },
    {
      title: 'Purchases & POs',
      icon: ShoppingCart,
      items: permissions.filter((p) => p.startsWith('purchases:')),
    },
    {
      title: 'Reports & Audit',
      icon: BarChart3,
      items: permissions.filter((p) => p.startsWith('reports:') || p.startsWith('audit_logs:')),
    },
    {
      title: 'Users & Roles',
      icon: Users,
      items: permissions.filter((p) => p.startsWith('users:') || p.startsWith('roles:')),
    },
    {
      title: 'Settings',
      icon: Sliders,
      items: permissions.filter((p) => p.startsWith('settings:')),
    },
  ].filter((g) => g.items.length > 0);

  // Password validation checks
  const hasMinLength = newPassword.length >= 12;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Account & Profile Settings</h1>
          <p className="text-xs text-text-muted mt-1">
            Manage your personal profile, company details, credentials, and inspect assigned security privileges.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Account
          </span>
          {getRoleBadge(role || undefined)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Account Meta */}
        <div className="lg:col-span-1 space-y-6">
          {/* Identity & Photo Card */}
          <div className="bg-surface rounded-[10px] border border-border p-6 shadow-subtle text-center space-y-5 relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent via-cyan-500 to-accent" />

            {/* Avatar with Camera Button */}
            <div className="relative inline-block mx-auto mt-2">
              <div className="w-24 h-24 rounded-full border-4 border-surface shadow-md overflow-hidden bg-accent/10 flex items-center justify-center text-accent">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-3xl">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              {uploadAvatarMutation.isPending && (
                <div className="absolute inset-0 rounded-full bg-surface/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFile}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-accent text-white hover:bg-accent-hover shadow-md transition-all hover:scale-105"
                title="Upload profile picture"
                aria-label="Upload profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-text">{user?.fullName || 'User'}</h2>
              <p className="text-xs font-mono text-text-muted mt-0.5">{user?.email}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {getRoleBadge(role || undefined)}
                <span className="text-[11px] text-text-muted font-medium">· Dental Team</span>
              </div>
            </div>

            {/* Avatar Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1.5"
                disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{user?.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </Button>

              {user?.avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-danger hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                  disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                  onClick={() => removeAvatarMutation.mutate()}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>

            {/* Metadata Info */}
            <div className="pt-4 border-t border-border text-left text-xs space-y-3 text-text-muted">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-text-muted/80">
                  User ID
                </span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="font-mono text-xs text-text truncate max-w-[190px]">
                    {user?.id}
                  </span>
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="p-1 rounded text-text-muted hover:text-accent hover:bg-surface-muted transition-colors"
                    title="Copy full User ID"
                  >
                    {copiedId ? (
                      <CheckCheck className="w-3.5 h-3.5 text-ok" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-text-muted/80">
                  Organization
                </span>
                <span className="text-text font-medium text-xs mt-0.5 block">
                  {clinicName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-text-muted/80">
                    Last Login
                  </span>
                  <span className="text-[11px] text-text font-mono">
                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Active now'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-text-muted/80">
                    Member Since
                  </span>
                  <span className="text-[11px] text-text font-mono">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Permissions Explorer */}
          <div className="bg-surface rounded-[10px] border border-border p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                  Granted Privileges
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-soft text-accent">
                {permissions.length} total
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 divide-y divide-border/60">
              {permissionGroups.map((group) => {
                const IconComponent = group.icon;
                return (
                  <div key={group.title} className="pt-2.5 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-text">
                      <span className="flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 text-accent/80" />
                        <span>{group.title}</span>
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.items.map((perm) => (
                        <span
                          key={perm}
                          className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-muted border border-border text-text-muted"
                          title={perm}
                        >
                          {perm.split(':')[1] || perm}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Edit Details & Change Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Edit Profile Details */}
          <div className="bg-surface rounded-[10px] border border-border p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <UserIcon className="w-5 h-5 text-accent" />
              <div>
                <h2 className="text-base font-bold text-text">Personal & Contact Information</h2>
                <p className="text-xs text-text-muted">
                  Update your display name, official communication email, and direct clinic phone.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required hint="Your official name on audit trails">
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Sokha Chan"
                      className="pl-9"
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Email Address" required hint="Used for system login & notifications">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@khema.local"
                      className="pl-9"
                      required
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Contact Phone" hint="Clinic or mobile phone">
                  <div className="relative">
                    <Phone className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+855 12 345 678"
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <FormField label="Assigned Role" hint="Managed by administrators">
                  <div className="relative">
                    <Building className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      value={role || 'STAFF'}
                      disabled
                      className="pl-9 bg-surface-muted/60 font-mono text-xs cursor-not-allowed text-text-muted"
                    />
                  </div>
                </FormField>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  isLoading={updateProfileMutation.isPending}
                  loadingText="Saving Profile..."
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Details</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Form 2: Change Account Password */}
          <div className="bg-surface rounded-[10px] border border-border p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <KeyRound className="w-5 h-5 text-accent" />
              <div>
                <h2 className="text-base font-bold text-text">{t('profile.changePassword')}</h2>
                <p className="text-xs text-text-muted">
                  Update credentials using Argon2id high-grade encryption. All other active sessions will be terminated for security.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <FormField label={t('profile.currentPassword')} required>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t('profile.newPassword')} required>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 12 chars, upper, lower, num, spec"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                <FormField label={t('profile.confirmNewPassword')} required>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-0.5"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>
              </div>

              {/* Password Strength Checklist */}
              {newPassword && (
                <div className="p-3 bg-surface-muted/50 rounded-[8px] border border-border text-[11px] space-y-1.5 animate-in fade-in duration-200">
                  <span className="font-semibold text-text block">Password Requirements:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-text-muted">
                    <span className={`flex items-center gap-1 ${hasMinLength ? 'text-ok font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-ok' : 'text-text-muted/40'}`} />
                      <span>12+ characters</span>
                    </span>
                    <span className={`flex items-center gap-1 ${hasUppercase ? 'text-ok font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasUppercase ? 'text-ok' : 'text-text-muted/40'}`} />
                      <span>Uppercase (A-Z)</span>
                    </span>
                    <span className={`flex items-center gap-1 ${hasLowercase ? 'text-ok font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasLowercase ? 'text-ok' : 'text-text-muted/40'}`} />
                      <span>Lowercase (a-z)</span>
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-ok font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-ok' : 'text-text-muted/40'}`} />
                      <span>Number (0-9)</span>
                    </span>
                    <span className={`flex items-center gap-1 ${hasSpecial ? 'text-ok font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${hasSpecial ? 'text-ok' : 'text-text-muted/40'}`} />
                      <span>Special symbol</span>
                    </span>
                    <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-ok font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-ok' : 'text-text-muted/40'}`} />
                      <span>Passwords match</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  isLoading={changePasswordMutation.isPending}
                  loadingText="Updating Password..."
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
