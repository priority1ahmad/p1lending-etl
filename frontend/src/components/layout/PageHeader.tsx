/**
 * PageHeader Component
 * Consistent page header with title, subtitle, and actions
 */

import { type ReactNode } from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import { textColors, borderColors } from '../../theme';
import { NavigateNext } from '@mui/icons-material';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Action buttons/elements on the right */
  actions?: ReactNode;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Add bottom border */
  bordered?: boolean;
  /** Custom className */
  className?: string;
}

const HeaderContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'bordered',
})<{ bordered?: boolean }>(({ bordered }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 24,
  paddingBottom: bordered ? 20 : 0,
  borderBottom: bordered ? `1px solid ${borderColors.default}` : 'none',
}));

const TopRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
});

const TitleSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

const ActionsSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
});

const StyledBreadcrumbs = styled(Breadcrumbs)({
  '& .MuiBreadcrumbs-separator': {
    margin: '0 4px',
  },
  '& .MuiBreadcrumbs-li': {
    fontSize: '0.8125rem',
  },
});

/**
 * PageHeader component for consistent page titles
 *
 * @example
 * // Simple header
 * <PageHeader title="Dashboard" />
 *
 * // With subtitle and actions
 * <PageHeader
 *   title="ETL Results"
 *   subtitle="View and export processed data"
 *   actions={<Button>Export</Button>}
 * />
 *
 * // With breadcrumbs
 * <PageHeader
 *   title="Edit Script"
 *   breadcrumbs={[
 *     { label: 'SQL Scripts', href: '/sql-files' },
 *     { label: 'Edit Script' }
 *   ]}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  bordered = false,
  className,
}: PageHeaderProps) {
  return (
    <HeaderContainer bordered={bordered} className={className}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <StyledBreadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast || !crumb.href) {
              return (
                <Typography
                  key={crumb.label}
                  sx={{
                    fontSize: '0.8125rem',
                    color: isLast ? textColors.primary : textColors.secondary,
                    fontWeight: isLast ? 500 : 400,
                  }}
                >
                  {crumb.label}
                </Typography>
              );
            }

            return (
              <Link
                key={crumb.label}
                href={crumb.href}
                underline="hover"
                sx={{
                  fontSize: '0.8125rem',
                  color: textColors.secondary,
                  '&:hover': {
                    color: textColors.primary,
                  },
                }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </StyledBreadcrumbs>
      )}

      <TopRow>
        <TitleSection>
          <Typography
            variant="h2"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: textColors.primary,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: textColors.secondary,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </TitleSection>

        {actions && <ActionsSection>{actions}</ActionsSection>}
      </TopRow>
    </HeaderContainer>
  );
}

export default PageHeader;
