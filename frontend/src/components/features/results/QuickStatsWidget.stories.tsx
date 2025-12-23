import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuickStatsWidget } from './QuickStatsWidget';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof QuickStatsWidget> = {
  title: 'Features/Results/QuickStatsWidget',
  component: QuickStatsWidget,
  tags: ['autodocs'],
  argTypes: {
    recordCount: {
      control: 'number',
      description: 'Total number of records processed',
    },
    cleanCount: {
      control: 'number',
      description: 'Number of clean records (no flags)',
    },
    litigatorCount: {
      control: 'number',
      description: 'Number of records flagged as litigators',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuickStatsWidget>;

// ============================================
// BASIC EXAMPLES
// ============================================

export const Default: Story = {
  args: {
    recordCount: 5000,
    cleanCount: 4565,
    litigatorCount: 234,
  },
};

export const SmallDataset: Story = {
  args: {
    recordCount: 50,
    cleanCount: 45,
    litigatorCount: 3,
  },
};

export const LargeDataset: Story = {
  args: {
    recordCount: 123456,
    cleanCount: 115432,
    litigatorCount: 5678,
  },
};

export const HighCleanRate: Story = {
  args: {
    recordCount: 10000,
    cleanCount: 9850,
    litigatorCount: 120,
  },
};

export const LowCleanRate: Story = {
  args: {
    recordCount: 10000,
    cleanCount: 5500,
    litigatorCount: 3200,
  },
};

// ============================================
// EDGE CASES
// ============================================

export const AllClean: Story = {
  args: {
    recordCount: 1000,
    cleanCount: 1000,
    litigatorCount: 0,
  },
};

export const AllFlagged: Story = {
  args: {
    recordCount: 1000,
    cleanCount: 0,
    litigatorCount: 1000,
  },
};

export const NoRecords: Story = {
  args: {
    recordCount: 0,
    cleanCount: 0,
    litigatorCount: 0,
  },
};

export const SingleRecord: Story = {
  args: {
    recordCount: 1,
    cleanCount: 1,
    litigatorCount: 0,
  },
};

export const ExactlyHalf: Story = {
  args: {
    recordCount: 1000,
    cleanCount: 500,
    litigatorCount: 300,
  },
};

// ============================================
// REALISTIC SCENARIOS
// ============================================

export const TypicalETLRun: Story = {
  args: {
    recordCount: 5000,
    cleanCount: 4565,
    litigatorCount: 234,
  },
};

export const HighComplianceRisk: Story = {
  args: {
    recordCount: 8000,
    cleanCount: 4200,
    litigatorCount: 2500,
  },
};

export const LowComplianceRisk: Story = {
  args: {
    recordCount: 7500,
    cleanCount: 7200,
    litigatorCount: 150,
  },
};

export const PreviewRun: Story = {
  args: {
    recordCount: 50,
    cleanCount: 47,
    litigatorCount: 2,
  },
};

export const MonthlyBatch: Story = {
  args: {
    recordCount: 250000,
    cleanCount: 228500,
    litigatorCount: 15600,
  },
};

// ============================================
// IN CONTEXT - RESULTS PAGE
// ============================================

export const InResultsPage: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          ETL Job Results
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Job ID: job-abc123 | Completed on Dec 15, 2025 at 2:30 PM
        </Typography>
      </Box>

      <QuickStatsWidget
        recordCount={5000}
        cleanCount={4565}
        litigatorCount={234}
      />

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Clean %:</strong> Automatically calculated as (cleanCount / recordCount) * 100
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          <strong>Responsive:</strong> Stacks vertically on mobile, horizontal on desktop
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>Icon Colors:</strong> Primary (records), Success (clean), Warning (litigators), Primary-dark (percentage)
        </Typography>
      </Box>
    </Box>
  ),
};

// ============================================
// MULTIPLE WIDGETS COMPARISON
// ============================================

export const ComparisonView: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Multiple Job Comparison
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Job 1: High Clean Rate (98.5%)
          </Typography>
          <QuickStatsWidget
            recordCount={10000}
            cleanCount={9850}
            litigatorCount={120}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Job 2: Medium Clean Rate (73.4%)
          </Typography>
          <QuickStatsWidget
            recordCount={8000}
            cleanCount={5872}
            litigatorCount={1456}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Job 3: Low Clean Rate (55.0%)
          </Typography>
          <QuickStatsWidget
            recordCount={6000}
            cleanCount={3300}
            litigatorCount={2100}
          />
        </Box>
      </Box>
    </Box>
  ),
};

// ============================================
// DIFFERENT SCREEN SIZES
// ============================================

export const MobileView: Story = {
  render: () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Mobile View (2x2 Grid)
      </Typography>
      <QuickStatsWidget
        recordCount={5000}
        cleanCount={4565}
        litigatorCount={234}
      />
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          On mobile, stats display in a 2x2 grid layout for better readability
        </Typography>
      </Box>
    </Box>
  ),
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

export const TabletView: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Tablet View (Horizontal)
      </Typography>
      <QuickStatsWidget
        recordCount={5000}
        cleanCount={4565}
        litigatorCount={234}
      />
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          On tablet and desktop, stats display horizontally with dividers
        </Typography>
      </Box>
    </Box>
  ),
  globals: {
    viewport: {
      value: 'tablet',
      isRotated: false
    }
  },
};

// ============================================
// WITH CONTEXT - DASHBOARD INTEGRATION
// ============================================

export const DashboardIntegration: Story = {
  render: () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        ETL Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor and analyze your ETL job results
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
          Latest Job Results
        </Typography>
        <QuickStatsWidget
          recordCount={5000}
          cleanCount={4565}
          litigatorCount={234}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
          Previous Job Results
        </Typography>
        <QuickStatsWidget
          recordCount={8000}
          cleanCount={7200}
          litigatorCount={512}
        />
      </Box>
    </Box>
  ),
};

// ============================================
// PERCENTAGE CALCULATION SHOWCASE
// ============================================

export const PercentageCalculations: Story = {
  render: () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Clean Percentage Calculation Examples
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            100% Clean (0 / 1000 flagged)
          </Typography>
          <QuickStatsWidget
            recordCount={1000}
            cleanCount={1000}
            litigatorCount={0}
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            91.3% Clean (4565 / 5000)
          </Typography>
          <QuickStatsWidget
            recordCount={5000}
            cleanCount={4565}
            litigatorCount={234}
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            50.0% Clean (500 / 1000)
          </Typography>
          <QuickStatsWidget
            recordCount={1000}
            cleanCount={500}
            litigatorCount={400}
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            0% Clean (0 / 1000 flagged)
          </Typography>
          <QuickStatsWidget
            recordCount={1000}
            cleanCount={0}
            litigatorCount={1000}
          />
        </Box>
      </Box>
    </Box>
  ),
};
