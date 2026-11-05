'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // When route finishes changing, complete the bar and fade out
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on internal links to start progress immediately
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Check if it's an internal navigation
      const isInternal =
        href.startsWith('/') &&
        !href.startsWith('//') &&
        target.getAttribute('target') !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey;

      if (isInternal) {
        try {
          const targetUrl = new URL(href, window.location.origin);
          // If moving to a different URL or search params
          if (
            targetUrl.pathname !== window.location.pathname ||
            targetUrl.search !== window.location.search
          ) {
            setVisible(true);
            setProgress(28);
            setTimeout(() => setProgress((p) => (p < 65 ? 65 : p)), 120);
            setTimeout(() => setProgress((p) => (p < 88 ? 88 : p)), 280);
          }
        } catch {
          // ignore invalid URLs
        }
      }
    };

    // Manual event triggers for background fetch or form submissions
    const handleStart = () => {
      setVisible(true);
      setProgress(30);
      setTimeout(() => setProgress(70), 150);
    };

    const handleDone = () => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    };

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('stockwise:start-loading', handleStart);
    window.addEventListener('stockwise:stop-loading', handleDone);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('stockwise:start-loading', handleStart);
      window.removeEventListener('stockwise:stop-loading', handleDone);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-[3px] bg-accent transition-all duration-300 ease-out shadow-[0_0_12px_var(--accent),0_0_4px_var(--accent)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}

