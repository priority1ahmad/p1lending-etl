/**
 * Design System: Shadows
 * Subtle, modern shadow system for depth and elevation
 */

import type { Shadows } from '@mui/material/styles';

// Custom shadow tokens
export const shadowTokens = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',

  // Focus ring for accessibility
  focus: '0 0 0 3px rgba(59, 130, 246, 0.15)',
  focusError: '0 0 0 3px rgba(239, 68, 68, 0.15)',
  focusSuccess: '0 0 0 3px rgba(16, 185, 129, 0.15)',

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
  innerMd: 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.06)',
} as const;

// MUI shadow array (24 levels)
// Using subtle shadows for modern SaaS look
export const muiShadows: Shadows = [
  'none', // 0
  shadowTokens.xs, // 1
  shadowTokens.sm, // 2
  shadowTokens.sm, // 3
  shadowTokens.md, // 4
  shadowTokens.md, // 5
  shadowTokens.md, // 6
  shadowTokens.lg, // 7
  shadowTokens.lg, // 8
  shadowTokens.lg, // 9
  shadowTokens.lg, // 10
  shadowTokens.xl, // 11
  shadowTokens.xl, // 12
  shadowTokens.xl, // 13
  shadowTokens.xl, // 14
  shadowTokens.xl, // 15
  shadowTokens.xl, // 16
  shadowTokens['2xl'], // 17
  shadowTokens['2xl'], // 18
  shadowTokens['2xl'], // 19
  shadowTokens['2xl'], // 20
  shadowTokens['2xl'], // 21
  shadowTokens['2xl'], // 22
  shadowTokens['2xl'], // 23
  shadowTokens['2xl'], // 24
];

// Elevation mapping for consistent usage
export const elevation = {
  none: 0,
  card: 1,
  cardHover: 2,
  dropdown: 4,
  modal: 8,
  tooltip: 12,
  popover: 16,
} as const;
