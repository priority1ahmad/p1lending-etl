/**
 * EmptyState Component
 * Consistent empty state display for lists, tables, etc.
 */

import { type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { textColors, palette } from '../../../theme';
import { InboxOutlined } from '@mui/icons-material';

export interface EmptyStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Action button/element */
  action?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    iconSize: 40,
    titleSize: '0.9375rem',
    descSize: '0.8125rem',
    padding: '24px 16px',
    gap: 12,
  },
  md: {
    iconSize: 56,
    titleSize: '1rem',
    descSize: '0.875rem',
    padding: '40px 24px',
    gap: 16,
  },
  lg: {
    iconSize: 72,
    titleSize: '1.125rem',
    descSize: '0.9375rem',
    padding: '56px 32px',
    gap: 20,
  },
};

const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'customSize',
})<{ customSize: keyof typeof sizeConfig }>(({ customSize }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: sizeConfig[customSize].padding,
  textAlign: 'center',
  gap: sizeConfig[customSize].gap,
}));

const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'customSize',
})<{ customSize: keyof typeof sizeConfig }>(({ customSize }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: sizeConfig[customSize].iconSize,
  height: sizeConfig[customSize].iconSize,
  borderRadius: '50%',
  backgroundColor: palette.gray[100],
  color: palette.gray[400],
  '& .MuiSvgIcon-root': {
    fontSize: sizeConfig[customSize].iconSize * 0.5,
  },
}));

/**
 * EmptyState component for empty lists, search results, etc.
 *
 * @example
 * // Basic empty state
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search criteria"
 * />
 *
 * // With custom icon and action
 * <EmptyState
 *   icon={<FolderIcon />}
 *   title="No files yet"
 *   description="Upload your first file to get started"
 *   action={<Button>Upload File</Button>}
 * />
 */
export function EmptyState({
  title = 'No data',
  description,
  icon,
  action,
  size = 'md',
}: EmptyStateProps) {
  return (
    <Container customSize={size}>
      <IconWrapper customSize={size}>
        {icon || <InboxOutlined />}
      </IconWrapper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: sizeConfig[size].titleSize,
            fontWeight: 500,
            color: textColors.primary,
          }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            sx={{
              fontSize: sizeConfig[size].descSize,
              color: textColors.secondary,
              maxWidth: 320,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Container>
  );
}

export default EmptyState;
