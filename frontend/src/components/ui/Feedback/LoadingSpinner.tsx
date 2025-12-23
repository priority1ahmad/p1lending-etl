/**
 * LoadingSpinner Component
 * Unified loading indicator with optional text
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { textColors, palette } from '../../../theme';

export interface LoadingSpinnerProps {
  /** Loading text */
  text?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Fill container height */
  fullHeight?: boolean;
  /** Spinner color */
  color?: 'primary' | 'accent' | 'inherit';
}

const sizeConfig = {
  sm: {
    spinner: 20,
    fontSize: '0.8125rem',
    gap: 8,
  },
  md: {
    spinner: 32,
    fontSize: '0.875rem',
    gap: 12,
  },
  lg: {
    spinner: 48,
    fontSize: '0.9375rem',
    gap: 16,
  },
};

const colorConfig = {
  primary: palette.primary[800],
  accent: palette.accent[500],
  inherit: 'inherit',
};

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'fullHeight',
})<{ fullHeight?: boolean }>(({ fullHeight }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  ...(fullHeight && {
    minHeight: '100%',
    height: '100%',
  }),
}));

/**
 * LoadingSpinner component
 *
 * @example
 * // Basic spinner
 * <LoadingSpinner />
 *
 * // With text
 * <LoadingSpinner text="Loading data..." />
 *
 * // Large, full height
 * <LoadingSpinner size="lg" fullHeight text="Fetching results..." />
 */
export function LoadingSpinner({
  text,
  size = 'md',
  fullHeight = false,
  color = 'accent',
}: LoadingSpinnerProps) {
  const config = sizeConfig[size];
  const spinnerColor = colorConfig[color];

  return (
    <Container fullHeight={fullHeight}>
      <CircularProgress
        size={config.spinner}
        sx={{ color: spinnerColor }}
      />
      {text && (
        <Typography
          sx={{
            mt: `${config.gap}px`,
            fontSize: config.fontSize,
            color: textColors.secondary,
          }}
        >
          {text}
        </Typography>
      )}
    </Container>
  );
}

export default LoadingSpinner;
