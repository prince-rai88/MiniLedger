/**
 * MiniLedger Design Tokens
 * Central design system for the app.
 */

export const Colors = {
  // Backgrounds
  bg: '#0b0b18',
  bgCard: '#13131f',
  bgCardAlt: '#1a1a2e',
  bgInput: '#1e1e30',

  // Brand
  primary: '#7c5cfc',
  primaryLight: '#9b7eff',
  primaryDark: '#5a3de0',
  primaryMuted: 'rgba(124,92,252,0.15)',

  // Status
  success: '#22c55e',
  successMuted: 'rgba(34,197,94,0.15)',
  danger: '#ef4444',
  dangerMuted: 'rgba(239,68,68,0.15)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245,158,11,0.15)',

  // Text
  textPrimary: '#f1f1f9',
  textSecondary: '#8b8ba0',
  textMuted: '#555568',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderFocus: 'rgba(124,92,252,0.5)',
};

export const Typography = {
  heading1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary, letterSpacing: -0.5 },
  heading2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary, letterSpacing: -0.3 },
  heading3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  mono: { fontSize: 14, fontFamily: 'monospace' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#7c5cfc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: '#7c5cfc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
};
