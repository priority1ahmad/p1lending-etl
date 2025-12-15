/**
 * P1Lending Design System
 * Modern SaaS-inspired theme (Linear, Notion, Vercel style)
 */

import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { muiPalette, palette, backgrounds, textColors, borderColors, semanticColors } from './palette';
import { muiTypography, fontFamily } from './typography';
import { muiShadows, shadowTokens, elevation } from './shadows';

// Spacing system (4px base)
const spacing = 4;

// Component overrides for modern SaaS aesthetic
const componentOverrides: ThemeOptions['components'] = {
  // ═══════════════════════════════════════════════════════════════
  // BUTTONS - Clean, solid colors, no gradients
  // ═══════════════════════════════════════════════════════════════
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        fontWeight: 500,
        textTransform: 'none',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: '0.875rem',
        transition: 'all 0.15s ease',
        '&:active': {
          transform: 'scale(0.98)',
        },
      },
      sizeSmall: {
        padding: '6px 12px',
        fontSize: '0.8125rem',
        borderRadius: 6,
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '0.9375rem',
        borderRadius: 10,
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: shadowTokens.sm,
        },
      },
      containedPrimary: {
        backgroundColor: palette.primary[800],
        '&:hover': {
          backgroundColor: palette.primary[700],
        },
      },
      containedSecondary: {
        backgroundColor: palette.accent[500],
        '&:hover': {
          backgroundColor: palette.accent[600],
        },
      },
      outlined: {
        borderColor: borderColors.default,
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: backgrounds.tertiary,
          borderColor: borderColors.strong,
        },
      },
      outlinedPrimary: {
        borderColor: palette.primary[300],
        color: palette.primary[800],
        '&:hover': {
          backgroundColor: palette.primary[50],
          borderColor: palette.primary[400],
        },
      },
      text: {
        '&:hover': {
          backgroundColor: backgrounds.tertiary,
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CARDS - Minimal, subtle border, no hover lift
  // ═══════════════════════════════════════════════════════════════
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: `1px solid ${borderColors.default}`,
        backgroundColor: backgrounds.primary,
        transition: 'border-color 0.15s ease',
        '&:hover': {
          borderColor: borderColors.strong,
        },
      },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },

  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: '20px 24px',
      },
      title: {
        fontSize: '1rem',
        fontWeight: 600,
        color: textColors.primary,
      },
      subheader: {
        fontSize: '0.875rem',
        color: textColors.secondary,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // PAPER - Consistent with cards
  // ═══════════════════════════════════════════════════════════════
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
      outlined: {
        border: `1px solid ${borderColors.default}`,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // INPUTS - Clean, modern form fields
  // ═══════════════════════════════════════════════════════════════
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'medium',
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          backgroundColor: backgrounds.primary,
          fontSize: '0.9375rem',
          '& fieldset': {
            borderColor: borderColors.default,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          },
          '&:hover fieldset': {
            borderColor: borderColors.strong,
          },
          '&.Mui-focused fieldset': {
            borderColor: palette.accent[500],
            borderWidth: 1,
            boxShadow: shadowTokens.focus,
          },
          '&.Mui-error fieldset': {
            borderColor: palette.error[500],
          },
          '&.Mui-error.Mui-focused fieldset': {
            boxShadow: shadowTokens.focusError,
          },
        },
        '& .MuiInputBase-input': {
          padding: '12px 14px',
        },
        '& .MuiInputBase-inputSizeSmall': {
          padding: '8px 12px',
          fontSize: '0.875rem',
        },
      },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: textColors.secondary,
        '&.Mui-focused': {
          color: palette.accent[600],
        },
      },
    },
  },

  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CHIPS/BADGES - Clean status indicators
  // ═══════════════════════════════════════════════════════════════
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
      },
      sizeSmall: {
        height: 20,
        fontSize: '0.6875rem',
      },
      colorSuccess: {
        backgroundColor: palette.success[50],
        color: palette.success[700],
        border: `1px solid ${palette.success[200]}`,
      },
      colorError: {
        backgroundColor: palette.error[50],
        color: palette.error[700],
        border: `1px solid ${palette.error[200]}`,
      },
      colorWarning: {
        backgroundColor: palette.warning[50],
        color: palette.warning[700],
        border: `1px solid ${palette.warning[200]}`,
      },
      colorInfo: {
        backgroundColor: palette.accent[50],
        color: palette.accent[700],
        border: `1px solid ${palette.accent[200]}`,
      },
      colorDefault: {
        backgroundColor: palette.gray[100],
        color: palette.gray[700],
        border: `1px solid ${palette.gray[200]}`,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TABLES - Clean, readable data display
  // ═══════════════════════════════════════════════════════════════
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: `1px solid ${borderColors.default}`,
        overflow: 'hidden',
      },
    },
  },

  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
    },
  },

  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: backgrounds.secondary,
        '& .MuiTableCell-head': {
          fontWeight: 500,
          color: textColors.secondary,
          fontSize: '0.8125rem',
          textTransform: 'none', // No uppercase!
          letterSpacing: 0,
          borderBottom: `1px solid ${borderColors.default}`,
          padding: '12px 16px',
        },
      },
    },
  },

  MuiTableBody: {
    styleOverrides: {
      root: {
        '& .MuiTableRow-root': {
          '&:hover': {
            backgroundColor: backgrounds.tertiary,
          },
          '&:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        },
      },
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${borderColors.light}`,
        padding: '14px 16px',
        fontSize: '0.875rem',
        color: textColors.primary,
      },
    },
  },

  MuiTablePagination: {
    styleOverrides: {
      root: {
        borderTop: `1px solid ${borderColors.default}`,
      },
      selectLabel: {
        fontSize: '0.8125rem',
        color: textColors.secondary,
      },
      displayedRows: {
        fontSize: '0.8125rem',
        color: textColors.secondary,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // DIALOGS - Clean modals
  // ═══════════════════════════════════════════════════════════════
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        boxShadow: muiShadows[16],
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.125rem',
        fontWeight: 600,
        padding: '20px 24px',
        borderBottom: `1px solid ${borderColors.default}`,
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '24px',
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
        borderTop: `1px solid ${borderColors.default}`,
        gap: 8,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // FEEDBACK - Alerts, progress, tooltips
  // ═══════════════════════════════════════════════════════════════
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: '0.875rem',
      },
      standardSuccess: {
        backgroundColor: palette.success[50],
        color: palette.success[800],
        border: `1px solid ${palette.success[200]}`,
        '& .MuiAlert-icon': {
          color: palette.success[500],
        },
      },
      standardError: {
        backgroundColor: palette.error[50],
        color: palette.error[800],
        border: `1px solid ${palette.error[200]}`,
        '& .MuiAlert-icon': {
          color: palette.error[500],
        },
      },
      standardWarning: {
        backgroundColor: palette.warning[50],
        color: palette.warning[800],
        border: `1px solid ${palette.warning[200]}`,
        '& .MuiAlert-icon': {
          color: palette.warning[500],
        },
      },
      standardInfo: {
        backgroundColor: palette.accent[50],
        color: palette.accent[800],
        border: `1px solid ${palette.accent[200]}`,
        '& .MuiAlert-icon': {
          color: palette.accent[500],
        },
      },
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
        backgroundColor: palette.gray[200],
      },
      barColorPrimary: {
        backgroundColor: palette.accent[500],
        borderRadius: 4,
      },
    },
  },

  MuiCircularProgress: {
    styleOverrides: {
      colorPrimary: {
        color: palette.accent[500],
      },
    },
  },

  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: palette.primary[800],
        color: textColors.inverse,
        fontSize: '0.75rem',
        fontWeight: 500,
        borderRadius: 6,
        padding: '6px 12px',
        boxShadow: muiShadows[8],
      },
      arrow: {
        color: palette.primary[800],
      },
    },
  },

  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: palette.gray[200],
        borderRadius: 6,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION - Menus, lists, tabs
  // ═══════════════════════════════════════════════════════════════
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: muiShadows[8],
        border: `1px solid ${borderColors.default}`,
        marginTop: 4,
      },
      list: {
        padding: '4px',
      },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        borderRadius: 6,
        padding: '8px 12px',
        margin: '2px 0',
        '&:hover': {
          backgroundColor: backgrounds.tertiary,
        },
        '&.Mui-selected': {
          backgroundColor: palette.accent[50],
          '&:hover': {
            backgroundColor: palette.accent[100],
          },
        },
      },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover': {
          backgroundColor: backgrounds.tertiary,
        },
        '&.Mui-selected': {
          backgroundColor: palette.accent[50],
          '&:hover': {
            backgroundColor: palette.accent[100],
          },
        },
      },
    },
  },

  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 40,
      },
      indicator: {
        backgroundColor: palette.accent[500],
        height: 2,
        borderRadius: 1,
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        minHeight: 40,
        padding: '8px 16px',
        color: textColors.secondary,
        '&.Mui-selected': {
          color: textColors.primary,
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // MISC - Dividers, avatars, badges
  // ═══════════════════════════════════════════════════════════════
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: borderColors.default,
      },
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: {
        backgroundColor: palette.accent[100],
        color: palette.accent[700],
        fontWeight: 500,
        fontSize: '0.875rem',
      },
    },
  },

  MuiBadge: {
    styleOverrides: {
      colorPrimary: {
        backgroundColor: palette.accent[500],
      },
      colorError: {
        backgroundColor: palette.error[500],
      },
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: backgrounds.tertiary,
        },
      },
    },
  },

  // CSS Baseline for consistent defaults
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: backgrounds.secondary,
        scrollbarWidth: 'thin',
        scrollbarColor: `${palette.gray[300]} transparent`,
        '&::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: palette.gray[300],
          borderRadius: 4,
          '&:hover': {
            backgroundColor: palette.gray[400],
          },
        },
      },
      '*': {
        boxSizing: 'border-box',
      },
      a: {
        color: textColors.link,
        textDecoration: 'none',
        '&:hover': {
          color: textColors.linkHover,
        },
      },
    },
  },
};

// Create the theme
const theme = createTheme({
  palette: muiPalette,
  typography: muiTypography,
  shadows: muiShadows,
  shape: {
    borderRadius: 8,
  },
  spacing,
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    duration: {
      shortest: 100,
      shorter: 150,
      short: 200,
      standard: 250,
      complex: 300,
      enteringScreen: 200,
      leavingScreen: 150,
    },
  },
  components: componentOverrides,
});

// Export theme and tokens for direct usage
export default theme;
export {
  // Color tokens
  palette,
  backgrounds,
  textColors,
  borderColors,
  semanticColors,
  // Typography tokens
  fontFamily,
  // Shadow tokens
  shadowTokens,
  elevation,
};

// Legacy export for backward compatibility (will be removed)
export const brandColors = {
  navy: palette.primary[800],
  offWhite: backgrounds.secondary,
  skyBlue: palette.accent[500],
  gold: palette.warning[500],
  blueGray: palette.gray[500],
  warmBrown: palette.warning[700],
};
