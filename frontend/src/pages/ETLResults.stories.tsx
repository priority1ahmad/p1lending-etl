import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { ETLResults } from './ETLResults';

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof ETLResults> = {
  title: 'Pages/ETLResults',
  component: ETLResults,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen', // Use full viewport for page component
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ETLResults>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default ETLResults page state
 *
 * Note: This page component has complex dependencies including:
 * - Multiple TanStack Query hooks (jobs list, stats, results data)
 * - WebSocket connection for real-time updates
 * - URL parameter reading with useSearchParams
 *
 * These stories demonstrate the UI layout. For fully interactive testing,
 * run the application with: npm run dev
 */
export const Default: Story = {
  render: () => (
    <Box>
      <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          ETLResults Page - Visual Layout Demo
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          This story shows the page UI structure. The component uses TanStack Query and WebSocket for data fetching.
        </Typography>
        <Typography variant="caption">
          For full functionality, test in the running application at http://173.255.232.167:3000/results
        </Typography>
      </Box>
      <ETLResults />
    </Box>
  ),
};

/**
 * ETLResults with URL parameter (job auto-selection)
 *
 * Demonstrates the URL parameter feature: ?job_id=xxx
 * The component reads this parameter and auto-selects the job
 */
export const WithURLParameter: Story = {
  render: () => (
    <Box>
      <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          URL Parameter Auto-Selection
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
          URL: /results?job_id=test-job-123
        </Typography>
        <Typography variant="caption">
          The component uses useSearchParams to read job_id and auto-select the job from the list
        </Typography>
      </Box>
      <MemoryRouter initialEntries={['/results?job_id=test-job-123']}>
        <Routes>
          <Route path="/results" element={<ETLResults />} />
        </Routes>
      </MemoryRouter>
    </Box>
  ),
};

/**
 * Page Design Showcase
 *
 * Shows the complete page layout with annotations explaining each section
 */
export const DesignShowcase: Story = {
  render: () => (
    <Box>
      <Box sx={{ mb: 3, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          ETL Results Page Architecture
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Page Components:
          </Typography>
          <Box component="ul" sx={{ pl: 2, '& li': { mb: 0.5 } }}>
            <li>
              <Typography variant="body2">
                <strong>Metrics Cards:</strong> Total jobs, records, litigators, clean records
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Charts:</strong> Processing trends, compliance distribution
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Jobs List:</strong> Collapsible list of all processed jobs with search/filter
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Results Table:</strong> Paginated records from selected job with export functionality
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Key Features:
          </Typography>
          <Box component="ul" sx={{ pl: 2, '& li': { mb: 0.5 } }}>
            <li>
              <Typography variant="body2">
                <strong>URL Parameter Reading:</strong> Auto-selects job from ?job_id query param
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Real-time Updates:</strong> WebSocket connection for live job completion events
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>CSV Export:</strong> Download results as CSV file (excludes litigators option)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Pagination:</strong> Results table with configurable rows per page
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Filtering:</strong> Search jobs, sort by date, filter by status
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Data Flow:
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            <Typography variant="body2" component="pre" sx={{ m: 0 }}>
{`1. Component mounts → useQuery fetches jobs list & stats
2. User selects job → useQuery fetches job results
3. WebSocket connects → Listens for job completion events
4. Job completes → WebSocket event → Auto-refresh queries
5. URL param detected → Auto-select job from list`}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Technical Dependencies:
          </Typography>
          <Box component="ul" sx={{ pl: 2, '& li': { mb: 0.5 } }}>
            <li>
              <Typography variant="body2">
                <code>@tanstack/react-query</code> - Server state management
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <code>socket.io-client</code> - Real-time WebSocket connection
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <code>react-router-dom</code> - URL parameter reading (useSearchParams)
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <code>recharts</code> - Data visualization charts
              </Typography>
            </li>
          </Box>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Live Page Preview:
      </Typography>
      <ETLResults />
    </Box>
  ),
};

/**
 * Component Documentation Reference
 *
 * Lists all sub-components that make up the ETLResults page
 */
export const ComponentBreakdown: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        ETL Results Page - Component Breakdown
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Metrics Section
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>ResultsMetricCard</strong> - Individual metric display card
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Location: <code>/components/features/results/ResultsMetricCard.tsx</code>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Charts Section
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>ResultsOverviewCharts</strong> - Processing trends and compliance charts
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Location: <code>/components/features/results/ResultsOverviewCharts.tsx</code>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Jobs List Section
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>JobsListCard</strong> - Collapsible jobs list with selection
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Location: <code>/components/features/results/JobsListCard.tsx</code>
          </Typography>

          <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>
            <strong>JobsFilterPanel</strong> - Search and filter controls
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Location: <code>/components/features/results/JobsFilterPanel.tsx</code>
          </Typography>

          <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>
            <strong>QuickStatsWidget</strong> - Quick statistics display
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Location: <code>/components/features/results/QuickStatsWidget.tsx</code>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Results Section
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>ResultsDataTable</strong> - Main results table with pagination
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Location: <code>/components/features/results/ResultsDataTable.tsx</code>
          </Typography>

          <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>
            <strong>ResultsTableToolbar</strong> - Export and table controls
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Location: <code>/components/features/results/ResultsTableToolbar.tsx</code>
          </Typography>

          <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>
            <strong>ResultsStatsBar</strong> - Statistics bar above table
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Location: <code>/components/features/results/ResultsStatsBar.tsx</code>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Note: Consider creating individual Storybook stories for sub-components
        </Typography>
        <Typography variant="caption">
          Each of the components listed above could have its own .stories.tsx file with dedicated examples,
          making them easier to develop, test, and document independently.
        </Typography>
      </Box>
    </Box>
  ),
};
