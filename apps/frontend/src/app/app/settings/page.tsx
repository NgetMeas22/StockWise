'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';
import { WarehouseDTO } from '@stockwise/shared';
import { Can } from '../../../components/auth/Can';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useToast } from '../../../lib/toast-context';
import { useTranslation } from '../../../i18n/i18n-context';
import { useTheme, AccentColor, InterfaceDensity, Theme, ACCENT_PRESETS } from '../../../lib/theme-context';
import {
  Settings,
  Building2,
  Sliders,
  Plus,
  Edit2,
  CheckCircle2,
  Save,
  Globe,
  DollarSign,
  Percent,
  Palette,
  Bell,
  Sun,
  Moon,
  Laptop,
  Check,
  Volume2,
  Calendar,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t, language, setLanguage, languages } = useTranslation();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    customColor,
    setCustomColor,
    density,
    setDensity,
  } = useTheme();

  const [hexInput, setHexInput] = useState(customColor);

  useEffect(() => {
    setHexInput(customColor);
  }, [customColor]);

  const [activeTab, setActiveTab] = useState<'appearance' | 'language' | 'notifications' | 'system' | 'warehouses'>('appearance');

  // App Settings State (from backend API)
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [showPrices, setShowPrices] = useState(true);
  const [showAvailability, setShowAvailability] = useState(true);
  const [tolerancePercent, setTolerancePercent] = useState('5');
  const [lowStockDefault, setLowStockDefault] = useState('10');
  const [defaultPageSize, setDefaultPageSize] = useState('15');

  // Local Preferences State
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [enableToasts, setEnableToasts] = useState(true);
  const [toastDuration, setToastDuration] = useState('4000');
  const [enableSound, setEnableSound] = useState(false);

  // Warehouse Modal State
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDTO | null>(null);
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [isDefaultWh, setIsDefaultWh] = useState(false);
  const [warehouseError, setWarehouseError] = useState<string | null>(null);

  // Fetch Settings
  const { data: settingsRes, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => apiRequest<Record<string, any>>('/settings'),
  });

  // Fetch Warehouses
  const { data: warehousesRes, isLoading: isWarehousesLoading } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => apiRequest<WarehouseDTO[]>('/warehouses'),
  });
  const warehouses = warehousesRes?.data || [];

  // Populate settings form from backend
  useEffect(() => {
    if (settingsRes?.data) {
      const s = settingsRes.data;
      if (s.currency_code) setCurrencyCode(s.currency_code);
      if (s.public_show_prices !== undefined) setShowPrices(s.public_show_prices === 'true' || s.public_show_prices === true);
      if (s.public_show_availability !== undefined) setShowAvailability(s.public_show_availability === 'true' || s.public_show_availability === true);
      if (s.over_receipt_tolerance_percent) setTolerancePercent(String(s.over_receipt_tolerance_percent));
      if (s.default_low_stock_threshold) setLowStockDefault(String(s.default_low_stock_threshold));
    }
  }, [settingsRes]);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const storedDateFormat = localStorage.getItem('stockwise_date_format');
      if (storedDateFormat) setDateFormat(storedDateFormat);

      const storedTimeFormat = localStorage.getItem('stockwise_time_format');
      if (storedTimeFormat) setTimeFormat(storedTimeFormat);

      const storedPageSize = localStorage.getItem('stockwise_page_size');
      if (storedPageSize) setDefaultPageSize(storedPageSize);

      const storedSound = localStorage.getItem('stockwise_sound');
      if (storedSound) setEnableSound(storedSound === 'true');
    } catch {}
  }, []);

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest('/settings', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success(t('settings.saveSuccess'));
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings.');
    },
  });

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save local preferences to localStorage
    try {
      localStorage.setItem('stockwise_date_format', dateFormat);
      localStorage.setItem('stockwise_time_format', timeFormat);
      localStorage.setItem('stockwise_page_size', defaultPageSize);
      localStorage.setItem('stockwise_sound', String(enableSound));
    } catch {}

    saveSettingsMutation.mutate({
      currency_code: currencyCode.toUpperCase(),
      public_show_prices: showPrices,
      public_show_availability: showAvailability,
      over_receipt_tolerance_percent: Number(tolerancePercent) || 0,
      default_low_stock_threshold: Number(lowStockDefault) || 0,
    });
  };

  // Warehouse Modal Openers
  const openNewWarehouseModal = () => {
    setEditingWarehouse(null);
    setWarehouseCode('');
    setWarehouseName('');
    setWarehouseAddress('');
    setIsDefaultWh(false);
    setWarehouseError(null);
    setShowWarehouseModal(true);
  };

  const openEditWarehouseModal = (w: WarehouseDTO) => {
    setEditingWarehouse(w);
    setWarehouseCode(w.code);
    setWarehouseName(w.name);
    setWarehouseAddress(w.address || '');
    setIsDefaultWh(w.isDefault);
    setWarehouseError(null);
    setShowWarehouseModal(true);
  };

  // Warehouse Mutation
  const saveWarehouseMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingWarehouse) {
        return apiRequest(`/warehouses/${editingWarehouse.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        return apiRequest('/warehouses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses-list'] });
      setShowWarehouseModal(false);
      toast.success(editingWarehouse ? 'Warehouse updated successfully.' : 'Warehouse created successfully.');
    },
    onError: (err: any) => {
      setWarehouseError(err.message || 'Failed to save warehouse.');
      toast.error(err.message || 'Failed to save warehouse.');
    },
  });

  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWarehouseError(null);

    if (!warehouseCode.trim()) {
      setWarehouseError('Warehouse code is required (e.g. WH-MAIN)');
      return;
    }
    if (!warehouseName.trim()) {
      setWarehouseError('Warehouse name is required');
      return;
    }

    saveWarehouseMutation.mutate({
      code: warehouseCode.trim().toUpperCase(),
      name: warehouseName.trim(),
      address: warehouseAddress.trim() || null,
      isDefault: isDefaultWh,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{t('settings.title')}</h1>
        <p className="text-sm text-text-muted mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>{t('settings.appearanceTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'language'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{t('settings.languageTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t('settings.notificationsTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'system'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t('settings.systemTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'warehouses'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('settings.warehousesTab')}</span>
        </button>
      </div>

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Theme Selector */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">{t('settings.themeLabel')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Choose how StockWise appears to you. Auto switch follows your operating system.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Light Mode Card */}
              <div
                onClick={() => setTheme('light')}
                className={`relative p-4 rounded-[8px] border-2 cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface-muted/30 hover:border-text-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-sm text-text">{t('settings.lightTheme')}</span>
                  </div>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                {/* Mini Light Mockup */}
                <div className="h-16 rounded border border-slate-200 bg-white p-2 flex flex-col gap-1.5 shadow-sm">
                  <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                  <div className="h-2 w-full bg-slate-100 rounded"></div>
                  <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                </div>
              </div>

              {/* Dark Mode Card (Pic 4 Style Matte Charcoal/Zinc) */}
              <div
                onClick={() => {
                  setTheme('dark');
                  toast.info('Dark Mode Activated', 'Sleek neutral dark palette applied.');
                }}
                className={`relative p-4 rounded-[8px] border-2 cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface-muted/30 hover:border-text-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span className="font-semibold text-sm text-text">{t('settings.darkTheme')}</span>
                  </div>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                {/* Mini Dark Mockup (Pic 4 Style) */}
                <div className="h-16 rounded border border-[#2e2e33] bg-[#121214] p-2 flex flex-col gap-1.5 shadow-sm">
                  <div className="h-2 w-1/3 bg-[#2e2e33] rounded"></div>
                  <div className="h-2 w-full bg-[#18181b] rounded"></div>
                  <div className="h-2 w-2/3 bg-[#18181b] rounded"></div>
                </div>
              </div>

              {/* System Mode Card */}
              <div
                onClick={() => {
                  setTheme('system');
                  toast.info('System Theme Sync', 'Theme will follow your device preferences.');
                }}
                className={`relative p-4 rounded-[8px] border-2 cursor-pointer transition-all ${
                  theme === 'system'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface-muted/30 hover:border-text-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-slate-500" />
                    <span className="font-semibold text-sm text-text">{t('settings.systemTheme')}</span>
                  </div>
                  {theme === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                {/* Mini Split Mockup */}
                <div className="h-16 rounded border border-border overflow-hidden flex shadow-sm">
                  <div className="w-1/2 bg-white p-2 flex flex-col gap-1.5">
                    <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                  </div>
                  <div className="w-1/2 bg-[#121214] p-2 flex flex-col gap-1.5">
                    <div className="h-2 w-2/3 bg-[#2e2e33] rounded"></div>
                    <div className="h-2 w-full bg-[#18181b] rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accent Color Selection (Clean, Compact, Short + Custom Color Setter) */}
          <div className="bg-surface rounded-[8px] border border-border p-5 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-text">{t('settings.accentColorLabel')}</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Pick a curated brand accent or set a custom hex color for buttons, badges, and highlights.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-text-muted font-medium">Active:</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
                  style={{ backgroundColor: accentColor === 'custom' ? customColor : (ACCENT_PRESETS.find(p => p.key === accentColor)?.color || customColor) }}
                >
                  <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  {accentColor === 'custom' ? customColor.toUpperCase() : (ACCENT_PRESETS.find(p => p.key === accentColor)?.name || 'Custom')}
                </span>
              </div>
            </div>

            {/* Presets and Custom Picker in one compact row/block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-1">
              {/* Left: Quick Preset Swatches */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Curated Themes</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {ACCENT_PRESETS.map((opt) => {
                    const isSelected = accentColor === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setAccentColor(opt.key);
                          setHexInput(opt.color);
                          toast.success('Accent color updated', `Brand accent set to ${opt.name}.`);
                        }}
                        title={opt.name}
                        className={`group relative flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-2 ring-accent/30 font-semibold'
                            : 'border-border bg-surface hover:border-text-muted/40 hover:bg-surface-muted'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: opt.color }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                        </div>
                        <span className="text-xs text-text">{opt.name.replace('Khema Dental ', '').replace('StockWise ', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Custom Color Setter */}
              <div className="p-3.5 rounded-[8px] bg-surface-muted/40 border border-border space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-accent" /> Set Custom Color
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-9 rounded-lg border border-border shadow-xs overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-accent transition-all">
                    <input
                      type="color"
                      value={hexInput}
                      onChange={(e) => {
                        setHexInput(e.target.value);
                        setCustomColor(e.target.value);
                      }}
                      className="absolute -inset-2 w-14 h-14 opacity-0 cursor-pointer"
                      title="Click to open color picker"
                    />
                    <div
                      className="w-full h-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: hexInput }}
                    >
                      {accentColor === 'custom' && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHexInput(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        setCustomColor(val);
                      }
                    }}
                    placeholder="#0284C7"
                    className="w-28 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-[6px] border border-border bg-surface text-text uppercase focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  <Button
                    type="button"
                    size="sm"
                    variant={accentColor === 'custom' ? 'primary' : 'outline'}
                    onClick={() => {
                      if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
                        setCustomColor(hexInput);
                        toast.success('Custom Color Applied', `Brand accent hex set to ${hexInput.toUpperCase()}`);
                      } else {
                        toast.error('Invalid Hex Format', 'Please enter a valid 6-character hex code like #0284C7');
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Interface Density */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">{t('settings.densityLabel')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Adjust table padding and component sizing for standard readability or high-density data viewing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => {
                  setDensity('comfortable');
                  toast.info('Density set to Comfortable', 'Spacious padding applied.');
                }}
                className={`p-4 rounded-[8px] border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  density === 'comfortable'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface-muted/30 hover:border-text-muted/40'
                }`}
              >
                <div className="p-2 rounded bg-accent/10 text-accent shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">{t('settings.comfortableDensity')}</span>
                    {density === 'comfortable' && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Spacious layout with generous touch padding. Recommended for mobile, tablet, and executive dashboards.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  setDensity('compact');
                  toast.info('Density set to Compact', 'High data density padding applied.');
                }}
                className={`p-4 rounded-[8px] border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  density === 'compact'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-surface-muted/30 hover:border-text-muted/40'
                }`}
              >
                <div className="p-2 rounded bg-accent/10 text-accent shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">{t('settings.compactDensity')}</span>
                    {density === 'compact' && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Dense data display with minimized row heights. Displays 35% more lines on desktop screens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Language & Region */}
      {activeTab === 'language' && (
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">{t('settings.languageLabel')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Switch language across all menus, forms, alerts, inventory ledgers, and dialogs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {languages.map((l) => (
                <div
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    toast.success(l.code === 'kh' ? 'បានប្តូរទៅភាសាខ្មែរដោយជោគជ័យ' : 'Switched to English successfully');
                  }}
                  className={`p-4 rounded-[8px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                    language === l.code
                      ? 'border-accent bg-accent/5 ring-1 ring-accent'
                      : 'border-border bg-surface-muted/30 hover:border-text-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{l.flag}</span>
                    <div>
                      <div className="text-sm font-semibold text-text">{l.name}</div>
                      <div className="text-xs text-text-muted font-khmer">{l.nativeName}</div>
                    </div>
                  </div>
                  {language === l.code && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time Formatting */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">Date & Time Regional Formatting</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Choose how timestamps, audit logs, and purchase order dates are displayed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label={t('settings.dateFormatLabel')} hint="Used for ledger and transaction tables">
                <select
                  value={dateFormat}
                  onChange={(e) => {
                    setDateFormat(e.target.value);
                    try { localStorage.setItem('stockwise_date_format', e.target.value); } catch {}
                    toast.success('Date format updated.');
                  }}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[6px] text-text focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 — 2026-11-05)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/Khmer — 05/11/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US — 11/05/2026)</option>
                </select>
              </FormField>

              <FormField label={t('settings.timeFormatLabel')} hint="Clock display standard">
                <select
                  value={timeFormat}
                  onChange={(e) => {
                    setTimeFormat(e.target.value);
                    try { localStorage.setItem('stockwise_time_format', e.target.value); } catch {}
                    toast.success('Time format updated.');
                  }}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[6px] text-text focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                >
                  <option value="24h">24-Hour Military Format (14:30:00)</option>
                  <option value="12h">12-Hour AM/PM Format (02:30:00 PM)</option>
                </select>
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">{t('settings.notificationsSection')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Configure real-time feedback, audible chimes, and automatic dismissal timeouts.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Enable Toasts */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text">{t('settings.enableToasts')}</div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t('settings.enableToastsDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableToasts}
                    onChange={(e) => {
                      setEnableToasts(e.target.checked);
                      toast.info(`In-app toast alerts ${e.target.checked ? 'enabled' : 'disabled'}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {/* Toast Auto Dismiss Duration */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <div className="text-sm font-semibold text-text">{t('settings.toastDuration')}</div>
                  <p className="text-xs text-text-muted mt-0.5">
                    How long alerts remain visible before automatically closing.
                  </p>
                </div>
                <select
                  value={toastDuration}
                  onChange={(e) => setToastDuration(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-surface border border-border rounded-[6px] text-text font-mono"
                >
                  <option value="3000">3 Seconds (Fast)</option>
                  <option value="4000">4 Seconds (Default)</option>
                  <option value="6000">6 Seconds (Standard)</option>
                  <option value="10000">10 Seconds (Extended)</option>
                </select>
              </div>

              {/* Sound alert chime */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <div className="text-sm font-semibold text-text">Audio Alerts for Critical Operations</div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Play a gentle audio ping on stock movement completions and validation alerts.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSound}
                    onChange={(e) => {
                      setEnableSound(e.target.checked);
                      try { localStorage.setItem('stockwise_sound', String(e.target.checked)); } catch {}
                      toast.info(`Audio alerts ${e.target.checked ? 'enabled' : 'disabled'}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {/* Test Notification Trigger */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text">Verification & Preview</div>
                  <p className="text-xs text-text-muted">Test your notification system styling and animation.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.success(t('settings.testToastMsg'))}
                  className="flex items-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{t('settings.testToastBtn')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System Policies */}
      {activeTab === 'system' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          {/* Section: Localization & Currency */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-semibold text-text border-b border-border pb-3">
              {t('settings.currencySection')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('settings.baseCurrency')} hint="ISO 3-letter currency code (e.g. USD, EUR, KHR)">
                <Input
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-bold"
                  maxLength={3}
                />
              </FormField>

              <FormField
                label={t('settings.tolerancePercent')}
                hint="Allowable receiving variance over ordered quantity on POs"
              >
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tolerancePercent}
                    onChange={(e) => setTolerancePercent(e.target.value)}
                    className="font-mono pr-8"
                  />
                  <Percent className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>
            </div>
          </div>

          {/* Section: Public Catalog Privacy */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-semibold text-text border-b border-border pb-3">
              {t('settings.privacySection')}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text">{t('settings.showPrices')}</div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t('settings.showPricesDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrices}
                    onChange={(e) => setShowPrices(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <div className="text-sm font-semibold text-text">{t('settings.showAvailability')}</div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t('settings.showAvailabilityDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAvailability}
                    onChange={(e) => setShowAvailability(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Inventory Policy Defaults */}
          <div className="bg-surface rounded-[8px] border border-border p-6 shadow-subtle space-y-4">
            <h2 className="text-base font-semibold text-text border-b border-border pb-3">
              {t('settings.inventoryDefaults')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('settings.defaultLowStock')} hint="Initial reorder point for new catalog items">
                <Input
                  type="number"
                  min="0"
                  value={lowStockDefault}
                  onChange={(e) => setLowStockDefault(e.target.value)}
                  className="font-mono"
                />
              </FormField>

              <FormField label={t('settings.defaultPageSize')} hint="Default records shown in paginated tables">
                <select
                  value={defaultPageSize}
                  onChange={(e) => setDefaultPageSize(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-[6px] text-text font-mono"
                >
                  <option value="10">10 Rows per page</option>
                  <option value="15">15 Rows per page (Standard)</option>
                  <option value="25">25 Rows per page</option>
                  <option value="50">50 Rows per page (Dense)</option>
                </select>
              </FormField>
            </div>
          </div>

          <Can permission="settings:manage">
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={saveSettingsMutation.isPending}
                loadingText="Saving Settings..."
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save System Policies</span>
              </Button>
            </div>
          </Can>
        </form>
      )}

      {/* Tab 5: Warehouse Facilities */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-text">Warehouse Storage Locations</h2>
              <p className="text-xs text-text-muted">
                Each warehouse tracks independent atomic inventory balances and movement logs.
              </p>
            </div>
            <Can permission="settings:manage">
              <Button onClick={openNewWarehouseModal} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>{t('settings.addWarehouse')}</span>
              </Button>
            </Can>
          </div>

          <div className="bg-surface rounded-[8px] border border-border shadow-subtle overflow-hidden">
            {isWarehousesLoading ? (
              <TableSkeleton rows={4} columns={6} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50 text-text-muted uppercase font-semibold text-[11px]">
                      <th className="px-4 py-3">{t('settings.warehouseCode')}</th>
                      <th className="px-4 py-3">{t('settings.facilityName')}</th>
                      <th className="px-4 py-3">Physical Address</th>
                      <th className="px-4 py-3 text-center">{t('settings.primaryDefault')}</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {warehouses.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-text">
                          {w.code}
                        </td>

                        <td className="px-4 py-3 font-semibold text-text">
                          {w.name}
                        </td>

                        <td className="px-4 py-3 text-text-muted">
                          {w.address || '—'}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {w.isDefault ? (
                            <Badge variant="success">Primary Default</Badge>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <Badge variant="neutral">{w.status}</Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Can permission="settings:manage">
                            <button
                              onClick={() => openEditWarehouseModal(w)}
                              title={t('settings.editWarehouse')}
                              className="p-1.5 text-text-muted hover:text-text rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </Can>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      <Modal
        isOpen={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        title={editingWarehouse ? t('settings.editWarehouse') : t('settings.addWarehouse')}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowWarehouseModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleWarehouseSubmit}
              isLoading={saveWarehouseMutation.isPending}
              loadingText={editingWarehouse ? 'Saving...' : 'Creating...'}
            >
              {editingWarehouse ? 'Save Changes' : 'Create Facility'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleWarehouseSubmit} className="space-y-4">
          {warehouseError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-danger text-xs rounded-[6px] flex items-center gap-2">
              <span className="font-medium">{warehouseError}</span>
            </div>
          )}

          <FormField label={t('settings.warehouseCode')} required hint="Short unique identifier">
            <Input
              value={warehouseCode}
              onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-NORTH"
              className="font-mono uppercase font-bold"
              required
            />
          </FormField>

          <FormField label={t('settings.facilityName')} required>
            <Input
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              placeholder="e.g. Northern Distribution Center"
              required
            />
          </FormField>

          <FormField label="Physical Address">
            <Input
              value={warehouseAddress}
              onChange={(e) => setWarehouseAddress(e.target.value)}
              placeholder="e.g. 500 Freight Lane, Building B"
            />
          </FormField>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefaultWhCheck"
              checked={isDefaultWh}
              onChange={(e) => setIsDefaultWh(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
            />
            <label htmlFor="isDefaultWhCheck" className="text-xs font-medium text-text cursor-pointer">
              {t('settings.primaryDefault')} (incoming shipments default)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
