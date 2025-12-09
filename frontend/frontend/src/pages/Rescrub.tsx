import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { brandColors } from '../theme';

export const Rescrub: React.FC = () => {
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: brandColors.navy,
            mb: 1,
          }}
        >
          Lead Re-scrub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Scheduled jobs to detect and apply lead data updates
        </Typography>
      </Box>

      {/* Coming Soon Card */}
      <Card>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              backgroundColor: `${brandColors.skyBlue}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <RefreshIcon sx={{ fontSize: 40, color: brandColors.skyBlue }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Coming Soon
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: 'center', maxWidth: 500 }}
          >
            This page will show scheduled re-scrub jobs that detect changes in
            BULK_PROPERTY_DATA and allow you to update existing leads.
          </Typography>
          <Alert severity="info" sx={{ mt: 4, maxWidth: 500 }}>
            This feature is part of the upcoming Lead Re-scrub MVP implementation.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};
