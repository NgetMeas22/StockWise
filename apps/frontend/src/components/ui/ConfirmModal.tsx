'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from '../../i18n/i18n-context';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningNote,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-danger shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'primary':
      default:
        return <Info className="w-5 h-5 text-accent shrink-0" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {getIcon()}
          <p className="text-sm text-text leading-relaxed">{message}</p>
        </div>

        {warningNote && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 rounded-[6px] text-xs">
            {warningNote}
          </div>
        )}
      </div>
    </Modal>
  );
}
