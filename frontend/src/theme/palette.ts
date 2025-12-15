/**
 * Design System: Color Palette
 * Modern SaaS-inspired color tokens (Linear, Notion, Vercel style)
 */

// Brand colors - slate-based modern palette
export const palette = {
  // Primary - Slate (replacing navy)
  primary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B', // Main primary
    900: '#0F172A',
  },

  // Accent - Blue (for interactive elements)
  accent: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main accent
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Semantic colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main success
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main error
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Background colors
export const backgrounds = {
  primary: '#FFFFFF',
  secondary: '#FAFBFC',
  tertiary: '#F3F4F6',
  elevated: '#FFFFFF',
} as const;

// Text colors
export const textColors = {
  primary: '#111827',
  secondary: '#6B7280',
  tertiary: '#9CA3AF',
  disabled: '#D1D5DB',
  inverse: '#FFFFFF',
  link: '#3B82F6',
  linkHover: '#2563EB',
} as const;

// Border colors
export const borderColors = {
  light: '#F3F4F6',
  default: '#E5E7EB',
  strong: '#D1D5DB',
  focus: '#3B82F6',
} as const;

// MUI palette configuration
export const muiPalette = {
  mode: 'light' as const,
  primary: {
    main: palette.primary[800],
    light: palette.primary[600],
    dark: palette.primary[900],
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: palette.accent[500],
    light: palette.accent[400],
    dark: palette.accent[600],
    contrastText: '#FFFFFF',
  },
  success: {
    main: palette.success[500],
    light: palette.success[400],
    dark: palette.success[600],
    contrastText: '#FFFFFF',
  },
  warning: {
    main: palette.warning[500],
    light: palette.warning[400],
    dark: palette.warning[600],
    contrastText: '#FFFFFF',
  },
  error: {
    main: palette.error[500],
    light: palette.error[400],
    dark: palette.error[600],
    contrastText: '#FFFFFF',
  },
  info: {
    main: palette.accent[500],
    light: palette.accent[400],
    dark: palette.accent[600],
    contrastText: '#FFFFFF',
  },
  grey: palette.gray,
  text: {
    primary: textColors.primary,
    secondary: textColors.secondary,
    disabled: textColors.disabled,
  },
  background: {
    default: backgrounds.secondary,
    paper: backgrounds.primary,
  },
  divider: borderColors.default,
  action: {
    active: palette.primary[800],
    hover: 'rgba(30, 41, 59, 0.04)',
    selected: 'rgba(30, 41, 59, 0.08)',
    disabled: 'rgba(30, 41, 59, 0.26)',
    disabledBackground: 'rgba(30, 41, 59, 0.12)',
    focus: 'rgba(59, 130, 246, 0.12)',
  },
};

// Export semantic color helpers
export const semanticColors = {
  // Status colors for badges/chips
  status: {
    running: palette.accent[500],
    completed: palette.success[500],
    failed: palette.error[500],
    cancelled: palette.gray[500],
    pending: palette.warning[500],
  },
  // Compliance colors
  compliance: {
    clean: palette.success[500],
    litigator: palette.error[500],
    dnc: palette.warning[500],
    both: palette.error[600],
  },
} as const;
