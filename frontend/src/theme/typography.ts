/**
 * Design System: Typography
 * Modern, clean typography scale using Inter font
 */

// Font family stack
export const fontFamily = {
  primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
} as const;

// Font weights
export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Type scale (rem-based for accessibility)
export const typeScale = {
  // Display - Hero sections only
  display: {
    fontSize: '2.25rem', // 36px
    fontWeight: fontWeights.semibold,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },

  // Headings
  h1: {
    fontSize: '1.875rem', // 30px
    fontWeight: fontWeights.semibold,
    lineHeight: 1.3,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.5rem', // 24px
    fontWeight: fontWeights.semibold,
    lineHeight: 1.35,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.25rem', // 20px
    fontWeight: fontWeights.medium,
    lineHeight: 1.4,
    letterSpacing: '0',
  },
  h4: {
    fontSize: '1rem', // 16px
    fontWeight: fontWeights.medium,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  h5: {
    fontSize: '0.9375rem', // 15px
    fontWeight: fontWeights.medium,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  h6: {
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeights.medium,
    lineHeight: 1.5,
    letterSpacing: '0',
  },

  // Body text
  body1: {
    fontSize: '0.9375rem', // 15px
    fontWeight: fontWeights.regular,
    lineHeight: 1.6,
    letterSpacing: '0',
  },
  body2: {
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeights.regular,
    lineHeight: 1.5,
    letterSpacing: '0',
  },

  // UI elements
  button: {
    fontSize: '0.875rem', // 14px
    fontWeight: fontWeights.medium,
    lineHeight: 1,
    letterSpacing: '0.01em',
    textTransform: 'none' as const, // No uppercase!
  },
  label: {
    fontSize: '0.8125rem', // 13px
    fontWeight: fontWeights.medium,
    lineHeight: 1.4,
    letterSpacing: '0',
  },
  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: fontWeights.regular,
    lineHeight: 1.4,
    letterSpacing: '0',
  },
  overline: {
    fontSize: '0.6875rem', // 11px
    fontWeight: fontWeights.semibold,
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },

  // Code/monospace
  code: {
    fontSize: '0.8125rem', // 13px
    fontWeight: fontWeights.regular,
    lineHeight: 1.6,
    letterSpacing: '0',
    fontFamily: fontFamily.mono,
  },
} as const;

// MUI typography configuration
export const muiTypography = {
  fontFamily: fontFamily.primary,
  fontWeightLight: 300,
  fontWeightRegular: fontWeights.regular,
  fontWeightMedium: fontWeights.medium,
  fontWeightBold: fontWeights.bold,

  h1: {
    fontFamily: fontFamily.primary,
    ...typeScale.h1,
  },
  h2: {
    fontFamily: fontFamily.primary,
    ...typeScale.h2,
  },
  h3: {
    fontFamily: fontFamily.primary,
    ...typeScale.h3,
  },
  h4: {
    fontFamily: fontFamily.primary,
    ...typeScale.h4,
  },
  h5: {
    fontFamily: fontFamily.primary,
    ...typeScale.h5,
  },
  h6: {
    fontFamily: fontFamily.primary,
    ...typeScale.h6,
  },
  subtitle1: {
    fontFamily: fontFamily.primary,
    fontSize: '1rem',
    fontWeight: fontWeights.medium,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  subtitle2: {
    fontFamily: fontFamily.primary,
    fontSize: '0.875rem',
    fontWeight: fontWeights.medium,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  body1: {
    fontFamily: fontFamily.primary,
    ...typeScale.body1,
  },
  body2: {
    fontFamily: fontFamily.primary,
    ...typeScale.body2,
  },
  button: {
    fontFamily: fontFamily.primary,
    ...typeScale.button,
  },
  caption: {
    fontFamily: fontFamily.primary,
    ...typeScale.caption,
  },
  overline: {
    fontFamily: fontFamily.primary,
    ...typeScale.overline,
  },
};
