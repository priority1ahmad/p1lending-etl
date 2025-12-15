/**
 * Card Component
 * Minimal card with subtle border styling
 * Variants: default (border), elevated (shadow)
 */

import { forwardRef, type ReactNode } from 'react';
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader as MuiCardHeader,
  CardActions as MuiCardActions,
  type CardProps as MuiCardProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { borderColors, backgrounds, textColors, shadowTokens } from '../../../theme';

// Card variants
export type CardVariant = 'default' | 'elevated' | 'ghost';

export interface CardProps extends Omit<MuiCardProps, 'variant' | 'title'> {
  /** Card style variant */
  variant?: CardVariant;
  /** Enable hover effect */
  hoverable?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Card header title */
  title?: ReactNode;
  /** Card header subtitle */
  subtitle?: ReactNode;
  /** Actions in card header */
  headerAction?: ReactNode;
  /** Footer actions */
  actions?: ReactNode;
}

const paddingSizes = {
  none: 0,
  sm: 16,
  md: 24,
  lg: 32,
};

const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) =>
    !['customVariant', 'hoverable', 'customPadding'].includes(prop as string),
})<{
  customVariant?: CardVariant;
  hoverable?: boolean;
  customPadding?: keyof typeof paddingSizes;
}>(({ customVariant = 'default', hoverable = false }) => {
  const baseStyles = {
    borderRadius: 12,
    backgroundColor: backgrounds.primary,
    transition: 'all 0.15s ease',
    overflow: 'hidden',
  };

  const hoverStyles = hoverable
    ? {
        cursor: 'pointer',
        '&:hover': {
          borderColor: borderColors.strong,
          boxShadow: shadowTokens.md,
        },
      }
    : {};

  switch (customVariant) {
    case 'elevated':
      return {
        ...baseStyles,
        border: 'none',
        boxShadow: shadowTokens.md,
        ...hoverStyles,
      };

    case 'ghost':
      return {
        ...baseStyles,
        border: 'none',
        boxShadow: 'none',
        backgroundColor: 'transparent',
        ...hoverStyles,
      };

    case 'default':
    default:
      return {
        ...baseStyles,
        border: `1px solid ${borderColors.default}`,
        boxShadow: 'none',
        ...hoverStyles,
      };
  }
});

const StyledCardContent = styled(MuiCardContent, {
  shouldForwardProp: (prop) => prop !== 'customPadding',
})<{
  customPadding?: keyof typeof paddingSizes;
}>(({ customPadding = 'md' }) => ({
  padding: paddingSizes[customPadding],
  '&:last-child': {
    paddingBottom: paddingSizes[customPadding],
  },
}));

const StyledCardHeader = styled(MuiCardHeader)(() => ({
  padding: '20px 24px',
  borderBottom: `1px solid ${borderColors.light}`,
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
    color: textColors.primary,
    lineHeight: 1.4,
  },
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    color: textColors.secondary,
    marginTop: 2,
  },
}));

const StyledCardActions = styled(MuiCardActions)(() => ({
  padding: '16px 24px',
  borderTop: `1px solid ${borderColors.light}`,
  gap: 8,
}));

/**
 * Card component with modern minimal styling
 *
 * @example
 * // Basic card
 * <Card title="Settings" subtitle="Manage your preferences">
 *   <CardContent>Content here</CardContent>
 * </Card>
 *
 * // Elevated card with hover
 * <Card variant="elevated" hoverable onClick={handleClick}>
 *   <CardContent>Clickable card</CardContent>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hoverable = false,
      padding = 'md',
      title,
      subtitle,
      headerAction,
      actions,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <StyledCard
        ref={ref}
        customVariant={variant}
        hoverable={hoverable}
        elevation={0}
        {...props}
      >
        {(title || subtitle || headerAction) && (
          <StyledCardHeader
            title={title}
            subheader={subtitle}
            action={headerAction}
          />
        )}
        {children && (
          <StyledCardContent customPadding={padding}>
            {children}
          </StyledCardContent>
        )}
        {actions && <StyledCardActions>{actions}</StyledCardActions>}
      </StyledCard>
    );
  }
);

Card.displayName = 'Card';

// Export sub-components for flexibility
export const CardContent = StyledCardContent;
export const CardHeader = StyledCardHeader;
export const CardActions = StyledCardActions;

export default Card;
