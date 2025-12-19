import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import ResultsOverviewCharts from './ResultsOverviewCharts';
import type { JobStats } from './ResultsOverviewCharts';
import type { ResultsStats } from '../../../services/api/results';

// ============================================
// MOCK DATA
// ============================================

/**
 * High compliance scenario (95% clean)
 */
const highComplianceStats: ResultsStats = {
  total_jobs: 42,
  total_records: 125000,
  total_litigators: 6250,
  clean_records: 118750,
  litigator_percentage: 5.0,
};

/**
 * Low compliance scenario (70% clean)
 */
const lowComplianceStats: ResultsStats = {
  total_jobs: 28,
  total_records: 80000,
  total_litigators: 24000,
  clean_records: 56000,
  litigator_percentage: 30.0,
};

/**
 * Balanced scenario (85% clean)
 */
const balancedStats: ResultsStats = {
  total_jobs: 35,
  total_records: 100000,
  total_litigators: 15000,
  clean_records: 85000,
  litigator_percentage: 15.0,
};

/**
 * Small dataset
 */
const smallDatasetStats: ResultsStats = {
  total_jobs: 5,
  total_records: 1000,
  total_litigators: 120,
  clean_records: 880,
  litigator_percentage: 12.0,
};

/**
 * Large dataset
 */
const largeDatasetStats: ResultsStats = {
  total_jobs: 156,
  total_records: 2500000,
  total_litigators: 187500,
  clean_records: 2312500,
  litigator_percentage: 7.5,
};

/**
 * Top 10 jobs by record count
 */
const topJobsMock: JobStats[] = [
  { job_name: 'Daily CA Leads - 12/15/2025', record_count: 15000 },
  { job_name: 'High Priority TX - 12/14/2025', record_count: 12500 },
  { job_name: 'Combined States Weekly', record_count: 11200 },
  { job_name: 'Monthly National Run - Dec', record_count: 9800 },
  { job_name: 'FL Export - Week 50', record_count: 8500 },
  { job_name: 'NY Priority Batch', record_count: 7800 },
  { job_name: 'Southwest Region Combo', record_count: 7200 },
  { job_name: 'East Coast Daily', record_count: 6500 },
  { job_name: 'Midwest Leads Weekly', record_count: 5900 },
  { job_name: 'Pacific Northwest Run', record_count: 5400 },
];

/**
 * Few jobs (less than 10)
 */
const fewJobsMock: JobStats[] = [
  { job_name: 'Job Alpha', record_count: 5000 },
  { job_name: 'Job Beta', record_count: 3500 },
  { job_name: 'Job Gamma', record_count: 2800 },
  { job_name: 'Job Delta', record_count: 1200 },
];

/**
 * Many jobs (more than 10, but only top 10 shown)
 */
const manyJobsMock: JobStats[] = [
  { job_name: 'California Daily Leads Export - Priority Processing', record_count: 25000 },
  { job_name: 'Texas High-Value Contacts Batch', record_count: 22000 },
  { job_name: 'Florida Weekly Mega Run', record_count: 20000 },
  { job_name: 'New York Premium Leads', record_count: 18500 },
  { job_name: 'Combined Midwest States', record_count: 17000 },
  { job_name: 'Southwest Region Processing', record_count: 15500 },
  { job_name: 'Pacific Northwest Bundle', record_count: 14200 },
  { job_name: 'East Coast Daily Run', record_count: 13000 },
  { job_name: 'National Weekly Aggregate', record_count: 12500 },
  { job_name: 'South Central Priority', record_count: 11800 },
  { job_name: 'Additional Job 11', record_count: 10500 },
  { job_name: 'Additional Job 12', record_count: 9200 },
  { job_name: 'Additional Job 13', record_count: 8000 },
  { job_name: 'Additional Job 14', record_count: 7100 },
  { job_name: 'Additional Job 15', record_count: 6300 },
];

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof ResultsOverviewCharts> = {
  title: 'Features/Results/ResultsOverviewCharts',
  component: ResultsOverviewCharts,
  tags: ['autodocs'],
  argTypes: {
    stats: {
      description: 'Overall results statistics for pie chart',
      table: {
        type: { summary: 'ResultsStats' },
      },
    },
    topJobs: {
      description: 'Top jobs by record count for bar chart (max 10 displayed)',
      table: {
        type: { summary: 'JobStats[]' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResultsOverviewCharts>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default charts with balanced data
 * Shows typical compliance distribution and top jobs
 */
export const Default: Story = {
  args: {
    stats: balancedStats,
    topJobs: topJobsMock,
  },
};

/**
 * High compliance scenario (95% clean records)
 * Demonstrates excellent compliance rates
 */
export const HighCompliance: Story = {
  args: {
    stats: highComplianceStats,
    topJobs: topJobsMock,
  },
};

/**
 * Low compliance scenario (70% clean records)
 * Shows dataset with higher litigator percentage
 */
export const LowCompliance: Story = {
  args: {
    stats: lowComplianceStats,
    topJobs: topJobsMock,
  },
};

/**
 * Small dataset (1,000 records, 5 jobs)
 * Demonstrates charts with smaller numbers
 */
export const SmallDataset: Story = {
  args: {
    stats: smallDatasetStats,
    topJobs: fewJobsMock,
  },
};

/**
 * Large dataset (2.5M records, 156 jobs)
 * Shows how charts handle large numbers with proper formatting
 */
export const LargeDataset: Story = {
  args: {
    stats: largeDatasetStats,
    topJobs: manyJobsMock,
  },
};

/**
 * Few jobs (less than 10)
 * Bar chart with fewer bars
 */
export const FewJobs: Story = {
  args: {
    stats: balancedStats,
    topJobs: fewJobsMock,
  },
};

/**
 * Long job names (truncated in chart)
 * Demonstrates text truncation for long job names
 */
export const LongJobNames: Story = {
  args: {
    stats: balancedStats,
    topJobs: manyJobsMock,
  },
};

/**
 * Complete page context
 * Shows charts as they appear in the ETL Results page
 */
export const InPageContext: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        ETL Results Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Visual overview of processing results and job performance
      </Typography>

      <ResultsOverviewCharts stats={balancedStats} topJobs={topJobsMock} />

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Pie Chart:</strong> Shows distribution of clean records vs litigators
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Bar Chart:</strong> Displays top 10 jobs by record count
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Tooltips:</strong> Hover over chart elements to see detailed values
        </Typography>
      </Box>
    </Box>
  ),
};

/**
 * Side-by-side comparison
 * Shows different compliance scenarios
 */
export const ComplianceComparison: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Compliance Scenarios Comparison
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
          High Compliance (95% Clean)
        </Typography>
        <ResultsOverviewCharts stats={highComplianceStats} topJobs={topJobsMock} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
          Medium Compliance (85% Clean)
        </Typography>
        <ResultsOverviewCharts stats={balancedStats} topJobs={topJobsMock} />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
          Low Compliance (70% Clean)
        </Typography>
        <ResultsOverviewCharts stats={lowComplianceStats} topJobs={topJobsMock} />
      </Box>
    </Box>
  ),
};
