/**
 * MiniLedger Design Tokens
 * Premium Apple Human Interface Guidelines (HIG) Dark Theme
 */

export const Colors = {
  // Apple System Backgrounds (OLED Black & Layered Surfaces)
  bg: '#000000',
  bgCard: '#121215',
  bgCardAlt: '#18181c',
  bgInput: '#1c1c20',
  bgInputFocus: '#222228',

  // Apple Accents (Vibrant yet refined)
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryMuted: 'rgba(99, 102, 241, 0.12)',

  // Apple System Semantic Tints
  success: '#34d399',
  successLight: '#6ee7b7',
  successMuted: 'rgba(52, 211, 153, 0.12)',

  danger: '#f87171',
  dangerLight: '#fca5a5',
  dangerMuted: 'rgba(248, 113, 113, 0.12)',

  warning: '#fbbf24',
  warningLight: '#fcd34d',
  warningMuted: 'rgba(251, 191, 36, 0.12)',

  // Apple Text Hierarchy
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textSubtle: '#4b5563',

  // Apple Hairline Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderFocus: 'rgba(99, 102, 241, 0.65)',
};

export const Typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  mono: {
    fontSize: 14,
    fontFamily: 'monospace' as const,
  },
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
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
};
