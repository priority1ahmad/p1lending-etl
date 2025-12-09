import { createTheme } from '@mui/material/styles';

/**
 * P1Lending Brand Color Palette
 * Source: priority1lending.com
 */
const brandColors = {
  navy: '#104265',        // Primary - Deep navy blue
  offWhite: '#F1F1F8',    // Background
  skyBlue: '#50A4D9',     // Accent - Buttons, links, active states
  gold: '#A6834E',        // Success/highlight accent
  blueGray: '#8796A0',    // Secondary text, borders, muted elements
  warmBrown: '#775A48',   // Tertiary accent (sparingly)
};

const theme = createTheme({
  palette: {
    primary: {
      main: brandColors.navy,
      light: '#1A5A8A',
      dark: '#0A2A45',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.skyBlue,
      light: '#7AB8E3',
      dark: '#3A8AC5',
      contrastText: '#FFFFFF',
    },
    background: {
      default: brandColors.offWhite,
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C',
      secondary: brandColors.blueGray,
      disabled: '#A0AEC0',
    },
    success: {
      main: '#38A169',
      light: '#48BB78',
      dark: '#2F855A',
    },
    error: {
      main: '#E53E3E',
      light: '#FC8181',
      dark: '#C53030',
    },
    warning: {
      main: brandColors.gold,
      light: '#C9A86C',
      dark: '#8A6B3E',
    },
    info: {
      main: brandColors.skyBlue,
      light: '#7AB8E3',
      dark: '#3A8AC5',
    },
    grey: {
      50: '#F7F9FC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: brandColors.blueGray,
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.375,
    },
    h4: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.375,
    },
    h5: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: brandColors.blueGray,
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  shadows: [
    'none',
    '0 1px 2px 0 rgba(16, 66, 101, 0.05)',
    '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
    '0 4px 6px -1px rgba(16, 66, 101, 0.1), 0 2px 4px -1px rgba(16, 66, 101, 0.06)',
    '0 10px 15px -3px rgba(16, 66, 101, 0.1), 0 4px 6px -2px rgba(16, 66, 101, 0.05)',
    '0 20px 25px -5px rgba(16, 66, 101, 0.1), 0 10px 10px -5px rgba(16, 66, 101, 0.04)',
    '0 25px 50px -12px rgba(16, 66, 101, 0.25)',
    '0 1px 2px 0 rgba(16, 66, 101, 0.05)',
    '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
    '0 4px 6px -1px rgba(16, 66, 101, 0.1), 0 2px 4px -1px rgba(16, 66, 101, 0.06)',
    '0 10px 15px -3px rgba(16, 66, 101, 0.1), 0 4px 6px -2px rgba(16, 66, 101, 0.05)',
    '0 20px 25px -5px rgba(16, 66, 101, 0.1), 0 10px 10px -5px rgba(16, 66, 101, 0.04)',
    '0 25px 50px -12px rgba(16, 66, 101, 0.25)',
    '0 1px 2px 0 rgba(16, 66, 101, 0.05)',
    '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
    '0 4px 6px -1px rgba(16, 66, 101, 0.1), 0 2px 4px -1px rgba(16, 66, 101, 0.06)',
    '0 10px 15px -3px rgba(16, 66, 101, 0.1), 0 4px 6px -2px rgba(16, 66, 101, 0.05)',
    '0 20px 25px -5px rgba(16, 66, 101, 0.1), 0 10px 10px -5px rgba(16, 66, 101, 0.04)',
    '0 25px 50px -12px rgba(16, 66, 101, 0.25)',
    '0 1px 2px 0 rgba(16, 66, 101, 0.05)',
    '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
    '0 4px 6px -1px rgba(16, 66, 101, 0.1), 0 2px 4px -1px rgba(16, 66, 101, 0.06)',
    '0 10px 15px -3px rgba(16, 66, 101, 0.1), 0 4px 6px -2px rgba(16, 66, 101, 0.05)',
    '0 20px 25px -5px rgba(16, 66, 101, 0.1), 0 10px 10px -5px rgba(16, 66, 101, 0.04)',
    '0 25px 50px -12px rgba(16, 66, 101, 0.25)',
  ],
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          textTransform: 'none',
          borderRadius: 6,
          padding: '8px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(16, 66, 101, 0.1), 0 2px 4px -1px rgba(16, 66, 101, 0.06)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
        },
        containedPrimary: {
          backgroundColor: brandColors.navy,
          '&:hover': {
            backgroundColor: '#0A2A45',
          },
        },
        containedSecondary: {
          backgroundColor: brandColors.skyBlue,
          '&:hover': {
            backgroundColor: '#3A8AC5',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(16, 66, 101, 0.04)',
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(16, 66, 101, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
          border: '1px solid #E2E8F0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(16, 66, 101, 0.1), 0 4px 6px -2px rgba(16, 66, 101, 0.05)',
            borderColor: '#CBD5E0',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(16, 66, 101, 0.1), 0 1px 2px 0 rgba(16, 66, 101, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E2E8F0',
              transition: 'border-color 0.15s ease',
            },
            '&:hover fieldset': {
              borderColor: brandColors.blueGray,
            },
            '&.Mui-focused fieldset': {
              borderColor: brandColors.skyBlue,
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: brandColors.blueGray,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        colorSuccess: {
          backgroundColor: 'rgba(56, 161, 105, 0.1)',
          color: '#2F855A',
        },
        colorError: {
          backgroundColor: 'rgba(229, 62, 62, 0.1)',
          color: '#C53030',
        },
        colorWarning: {
          backgroundColor: `rgba(166, 131, 78, 0.1)`,
          color: brandColors.warmBrown,
        },
        colorInfo: {
          backgroundColor: `rgba(80, 164, 217, 0.1)`,
          color: brandColors.navy,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: brandColors.navy,
          fontSize: '0.75rem',
          borderRadius: 4,
          padding: '6px 10px',
        },
        arrow: {
          color: brandColors.navy,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: brandColors.offWhite,
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: brandColors.navy,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
          padding: '12px 16px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#E2E8F0',
        },
        barColorPrimary: {
          backgroundColor: brandColors.skyBlue,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: brandColors.skyBlue,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: 'rgba(56, 161, 105, 0.1)',
          color: '#2F855A',
        },
        standardError: {
          backgroundColor: 'rgba(229, 62, 62, 0.1)',
          color: '#C53030',
        },
        standardWarning: {
          backgroundColor: 'rgba(166, 131, 78, 0.1)',
          color: brandColors.warmBrown,
        },
        standardInfo: {
          backgroundColor: 'rgba(80, 164, 217, 0.1)',
          color: brandColors.navy,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: '#E2E8F0',
        },
      },
    },
  },
});

export default theme;
export { brandColors };
