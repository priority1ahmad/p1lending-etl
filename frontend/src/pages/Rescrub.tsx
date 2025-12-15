/**
 * Rescrub Page
 * Coming soon placeholder with modern SaaS styling
 */

import { Box, Alert } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Components
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card/Card';
import { EmptyState } from '../components/ui/Feedback/EmptyState';
import { palette } from '../theme';

export function Rescrub() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Lead Re-scrub"
        subtitle="Scheduled jobs to detect and apply lead data updates"
      />

      <Card variant="default" padding="lg">
        <EmptyState
          icon={
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                backgroundColor: palette.accent[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Refresh sx={{ fontSize: 40, color: palette.accent[500] }} />
            </Box>
          }
          title="Coming Soon"
          description="This page will show scheduled re-scrub jobs that detect changes in BULK_PROPERTY_DATA and allow you to update existing leads."
          size="lg"
        />
        <Alert severity="info" sx={{ mt: 4, maxWidth: 500, mx: 'auto' }}>
          This feature is part of the upcoming Lead Re-scrub MVP implementation.
        </Alert>
      </Card>
    </Box>
  );
}
