import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Grid } from '@mui/material';
import { ResultsStatsBar } from './ResultsStatsBar';
import type { ResultsStats } from './ResultsStatsBar';

// ============================================
// MOCK DATA
// ============================================

/**
 * Typical stats with good compliance rate
 */
const typicalStats: ResultsStats = {
  total_jobs: 42,
  total_records: 125000,
  clean_records: 118500,
  total_litigators: 6500,
  litigator_percentage: 5.2,
};

/**
 * Low volume stats
 */
const lowVolumeStats: ResultsStats = {
  total_jobs: 3,
  total_records: 1250,
  clean_records: 1180,
  total_litigators: 70,
  litigator_percentage: 5.6,
};

/**
 * High volume stats
 */
const highVolumeStats: ResultsStats = {
  total_jobs: 187,
  total_records: 2500000,
  clean_records: 2325000,
  total_litigators: 175000,
  litigator_percentage: 7.0,
};

/**
 * High litigator percentage
 */
const highRiskStats: ResultsStats = {
  total_jobs: 15,
  total_records: 50000,
  clean_records: 37500,
  total_litigators: 12500,
  litigator_percentage: 25.0,
};

/**
 * Zero litigators (perfect compliance)
 */
const perfectComplianceStats: ResultsStats = {
  total_jobs: 8,
  total_records: 10000,
  clean_records: 10000,
  total_litigators: 0,
  litigator_percentage: 0.0,
};

/**
 * All litigators (worst case)
 */
const allLitigatorsStats: ResultsStats = {
  total_jobs: 2,
  total_records: 500,
  clean_records: 0,
  total_litigators: 500,
  litigator_percentage: 100.0,
};

/**
 * Single job stats
 */
const singleJobStats: ResultsStats = {
  total_jobs: 1,
  total_records: 5000,
  clean_records: 4750,
  total_litigators: 250,
  litigator_percentage: 5.0,
};

/**
 * Empty stats (no jobs run yet)
 */
const emptyStats: ResultsStats = {
  total_jobs: 0,
  total_records: 0,
  clean_records: 0,
  total_litigators: 0,
  litigator_percentage: 0,
};

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof ResultsStatsBar> = {
  title: 'Features/Results/ResultsStatsBar',
  component: ResultsStatsBar,
  tags: ['autodocs'],
  argTypes: {
    stats: {
      description: 'Statistics object containing job and record counts',
      table: {
        type: { summary: 'ResultsStats' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResultsStatsBar>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default stats bar with typical values
 */
export const Default: Story = {
  args: {
    stats: typicalStats,
  },
};

/**
 * Low volume scenario
 */
export const LowVolume: Story = {
  args: {
    stats: lowVolumeStats,
  },
};

/**
 * High volume scenario with millions of records
 */
export const HighVolume: Story = {
  args: {
    stats: highVolumeStats,
  },
};

/**
 * High risk scenario with 25% litigators
 */
export const HighRisk: Story = {
  args: {
    stats: highRiskStats,
  },
};

/**
 * Perfect compliance - no litigators
 */
export const PerfectCompliance: Story = {
  args: {
    stats: perfectComplianceStats,
  },
};

/**
 * Worst case - all records are litigators
 */
export const AllLitigators: Story = {
  args: {
    stats: allLitigatorsStats,
  },
};

/**
 * Single job statistics
 */
export const SingleJob: Story = {
  args: {
    stats: singleJobStats,
  },
};

/**
 * Empty state - no jobs run yet
 */
export const Empty: Story = {
  args: {
    stats: emptyStats,
  },
};

/**
 * Comparison grid showing different scenarios
 */
export const ComparisonGrid: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Statistics Comparison
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Low Volume
          </Typography>
          <ResultsStatsBar stats={lowVolumeStats} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Typical Volume
          </Typography>
          <ResultsStatsBar stats={typicalStats} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            High Volume
          </Typography>
          <ResultsStatsBar stats={highVolumeStats} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
            High Risk
          </Typography>
          <ResultsStatsBar stats={highRiskStats} />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
            Perfect Compliance
          </Typography>
          <ResultsStatsBar stats={perfectComplianceStats} />
        </Grid>
      </Grid>
    </Box>
  ),
};

/**
 * Component in dashboard context
 */
export const InDashboardContext: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
          ETL Results Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overall statistics across all ETL jobs
        </Typography>
      </Box>

      <ResultsStatsBar stats={highVolumeStats} />

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Total Jobs:</strong> Number of completed ETL jobs with results stored in Snowflake
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Total Records:</strong> Sum of all processed records across all jobs
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Clean Records:</strong> Records not flagged as litigators (safe to contact)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Litigators:</strong> Records flagged in CCC litigator database (do not contact)
        </Typography>
      </Box>
    </Box>
  ),
};

/**
 * Component in results page context
 */
export const InResultsPageContext: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
          ETL Results
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Browse and export processed records
        </Typography>
      </Box>

      <ResultsStatsBar stats={typicalStats} />

      <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Job Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a job below to view detailed records and export data
        </Typography>
      </Box>
    </Box>
  ),
};

/**
 * Responsive behavior demonstration
 */
export const ResponsiveBehavior: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Responsive Layout
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Desktop (1400px)
        </Typography>
        <Box sx={{ maxWidth: 1400, border: '1px dashed gray', p: 2 }}>
          <ResultsStatsBar stats={typicalStats} />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tablet (768px)
        </Typography>
        <Box sx={{ maxWidth: 768, border: '1px dashed gray', p: 2 }}>
          <ResultsStatsBar stats={typicalStats} />
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Mobile (375px)
        </Typography>
        <Box sx={{ maxWidth: 375, border: '1px dashed gray', p: 2 }}>
          <ResultsStatsBar stats={typicalStats} />
        </Box>
      </Box>
    </Box>
  ),
};
