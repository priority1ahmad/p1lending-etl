/**
 * Button Component
 * Modern, clean button with solid colors (no gradients)
 * Variants: solid, outline, ghost, link
 */

import { forwardRef } from 'react';
import {
  Button as MuiButton,
  type ButtonProps as MuiButtonProps,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { palette } from '../../../theme';

// Extended props for our custom button
export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  /** Button style variant */
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  /** Color scheme */
  colorScheme?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  /** Show loading spinner */
  loading?: boolean;
  /** Loading text (optional) */
  loadingText?: string;
}

// Color configurations for each scheme
const colorSchemes = {
  primary: {
    solid: {
      bg: palette.primary[800],
      bgHover: palette.primary[700],
      text: '#FFFFFF',
    },
    outline: {
      border: palette.primary[300],
      borderHover: palette.primary[400],
      bgHover: palette.primary[50],
      text: palette.primary[800],
    },
    ghost: {
      bgHover: palette.primary[50],
      text: palette.primary[800],
    },
    link: {
      text: palette.primary[700],
      textHover: palette.primary[800],
    },
  },
  accent: {
    solid: {
      bg: palette.accent[500],
      bgHover: palette.accent[600],
      text: '#FFFFFF',
    },
    outline: {
      border: palette.accent[300],
      borderHover: palette.accent[400],
      bgHover: palette.accent[50],
      text: palette.accent[600],
    },
    ghost: {
      bgHover: palette.accent[50],
      text: palette.accent[600],
    },
    link: {
      text: palette.accent[500],
      textHover: palette.accent[600],
    },
  },
  success: {
    solid: {
      bg: palette.success[500],
      bgHover: palette.success[600],
      text: '#FFFFFF',
    },
    outline: {
      border: palette.success[300],
      borderHover: palette.success[400],
      bgHover: palette.success[50],
      text: palette.success[700],
    },
    ghost: {
      bgHover: palette.success[50],
      text: palette.success[700],
    },
    link: {
      text: palette.success[600],
      textHover: palette.success[700],
    },
  },
  warning: {
    solid: {
      bg: palette.warning[500],
      bgHover: palette.warning[600],
      text: '#FFFFFF',
    },
    outline: {
      border: palette.warning[300],
      borderHover: palette.warning[400],
      bgHover: palette.warning[50],
      text: palette.warning[700],
    },
    ghost: {
      bgHover: palette.warning[50],
      text: palette.warning[700],
    },
    link: {
      text: palette.warning[600],
      textHover: palette.warning[700],
    },
  },
  error: {
    solid: {
      bg: palette.error[500],
      bgHover: palette.error[600],
      text: '#FFFFFF',
    },
    outline: {
      border: palette.error[300],
      borderHover: palette.error[400],
      bgHover: palette.error[50],
      text: palette.error[700],
    },
    ghost: {
      bgHover: palette.error[50],
      text: palette.error[700],
    },
    link: {
      text: palette.error[600],
      textHover: palette.error[700],
    },
  },
};

// Styled button with our custom variants
const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) =>
    !['colorScheme', 'loading', 'loadingText', 'variant'].includes(prop as string),
})<{
  customVariant?: 'solid' | 'outline' | 'ghost' | 'link';
  colorScheme?: keyof typeof colorSchemes;
}>(({ customVariant = 'solid', colorScheme = 'primary' }) => {
  const colors = colorSchemes[colorScheme];

  const baseStyles = {
    fontWeight: 500,
    textTransform: 'none' as const,
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease',
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };

  switch (customVariant) {
    case 'solid':
      return {
        ...baseStyles,
        backgroundColor: colors.solid.bg,
        color: colors.solid.text,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: colors.solid.bgHover,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
      };

    case 'outline':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: colors.outline.text,
        border: `1px solid ${colors.outline.border}`,
        '&:hover': {
          backgroundColor: colors.outline.bgHover,
          borderColor: colors.outline.borderHover,
        },
      };

    case 'ghost':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: colors.ghost.text,
        '&:hover': {
          backgroundColor: colors.ghost.bgHover,
        },
      };

    case 'link':
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: colors.link.text,
        padding: '4px 8px',
        '&:hover': {
          backgroundColor: 'transparent',
          color: colors.link.textHover,
          textDecoration: 'underline',
        },
      };

    default:
      return baseStyles;
  }
});

/**
 * Button component with modern SaaS styling
 *
 * @example
 * // Solid primary button
 * <Button variant="solid" colorScheme="primary">Save</Button>
 *
 * // Outline accent button
 * <Button variant="outline" colorScheme="accent">Cancel</Button>
 *
 * // Loading state
 * <Button loading loadingText="Saving...">Save</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      colorScheme = 'primary',
      loading = false,
      loadingText,
      disabled,
      children,
      startIcon,
      ...props
    },
    ref
  ) => {
    return (
      <StyledButton
        ref={ref}
        customVariant={variant}
        colorScheme={colorScheme}
        disabled={disabled || loading}
        startIcon={
          loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            startIcon
          )
        }
        {...props}
      >
        {loading && loadingText ? loadingText : children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
