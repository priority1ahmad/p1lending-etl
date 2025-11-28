import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E3A5F',      // Deep navy blue
      light: '#2D5A8A',     // Medium blue
      dark: '#0F1F33',      // Dark navy
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4A90D9',      // Sky blue
      light: '#6BA8E8',     // Light sky blue
      dark: '#2D5A8A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F9FC',   // Off-white with blue tint
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C',   // Near black
      secondary: '#4A5568',  // Dark gray
      disabled: '#A0AEC0',  // Light gray
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
      main: '#D69E2E',
      light: '#F6AD55',
      dark: '#B7791F',
    },
    info: {
      main: '#4A90D9',
      light: '#6BA8E8',
      dark: '#2D5A8A',
    },
    grey: {
      50: '#F7F9FC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
  },
  typography: {
    fontFamily: '"Open Sans", "Segoe UI", system-ui, sans-serif',
    h1: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 700,
      fontSize: '3rem',      // 48px
      lineHeight: 1.25,
    },
    h2: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 700,
      fontSize: '2.25rem',   // 36px
      lineHeight: 1.25,
    },
    h3: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.875rem',  // 30px
      lineHeight: 1.375,
    },
    h4: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',    // 24px
      lineHeight: 1.375,
    },
    h5: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',   // 20px
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',  // 18px
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',      // 16px
      lineHeight: 1.5,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',   // 14px
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 8,  // 0.5rem
  },
  spacing: 4,  // 4px base unit
  shadows: [
    'none',
    '0 1px 2px 0 rgba(30, 58, 95, 0.05)',  // sm
    '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -1px rgba(30, 58, 95, 0.06)',  // md
    '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05)',  // lg
    '0 20px 25px -5px rgba(30, 58, 95, 0.1), 0 10px 10px -5px rgba(30, 58, 95, 0.04)',  // xl
    '0 25px 50px -12px rgba(30, 58, 95, 0.25)',  // 2xl
    '0 4px 14px 0 rgba(232, 99, 43, 0.35)',  // CTA shadow
    '0 6px 20px 0 rgba(232, 99, 43, 0.45)',  // CTA hover shadow
    '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
    '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -1px rgba(30, 58, 95, 0.06)',
    '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05)',
    '0 20px 25px -5px rgba(30, 58, 95, 0.1), 0 10px 10px -5px rgba(30, 58, 95, 0.04)',
    '0 25px 50px -12px rgba(30, 58, 95, 0.25)',
    '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
    '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
    '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
    '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -1px rgba(30, 58, 95, 0.06)',
    '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05)',
    '0 20px 25px -5px rgba(30, 58, 95, 0.1), 0 10px 10px -5px rgba(30, 58, 95, 0.04)',
    '0 25px 50px -12px rgba(30, 58, 95, 0.25)',
    '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
    '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
    '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
    '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -1px rgba(30, 58, 95, 0.06)',
    '0 10px 15px -3px rgba(30, 58, 95, 0.1), 0 4px 6px -2px rgba(30, 58, 95, 0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          fontFamily: '"Montserrat", "Segoe UI", system-ui, sans-serif',
          borderRadius: '0.5rem',  // 8px
          padding: '0.75rem 1.5rem',  // 12px 24px
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(232, 99, 43, 0.35)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(232, 99, 43, 0.45)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',  // 12px
          boxShadow: '0 4px 6px -1px rgba(30, 58, 95, 0.1), 0 2px 4px -1px rgba(30, 58, 95, 0.06)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 20px 25px -5px rgba(30, 58, 95, 0.1), 0 10px 10px -5px rgba(30, 58, 95, 0.04)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.25rem',  // 4px
            '& fieldset': {
              borderColor: '#CBD5E0',
            },
            '&:hover fieldset': {
              borderColor: '#4A90D9',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4A90D9',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',  // 14px
          fontWeight: 500,
          color: '#4A5568',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgba(30, 58, 95, 0.05)',
          backgroundColor: '#FFFFFF',
          color: '#1A202C',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',  // 8px
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',  // 12px
        },
      },
    },
  },
});

export default theme;

