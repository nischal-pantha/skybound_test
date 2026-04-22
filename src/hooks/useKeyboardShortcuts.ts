import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onNavigate: (section: string) => void;
  onSearch?: () => void;
}

const NAV_MAP: Record<string, string> = {
  '1': 'dashboard',
  '2': 'flight-planning',
  '3': 'sectional',
  '4': 'weather',
  '5': 'weight-balance',
  '6': 'performance',
  '7': 'checklists',
  '8': 'logbook',
};

export function useKeyboardShortcuts({ onNavigate, onSearch }: KeyboardShortcutsOptions) {
  const handler = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

    // Cmd/Ctrl+K — search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onSearch?.();
      return;
    }

    if (isInput) return;

    // Number keys for nav
    if (NAV_MAP[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      onNavigate(NAV_MAP[e.key]);
    }
  }, [onNavigate, onSearch]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
