import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Paper } from '@mui/material';
import { JobsFilterPanel } from './JobsFilterPanel';
import type { JobFilters, SortOption } from './JobsFilterPanel';
import { palette } from '../../../theme';
import { useState } from 'react';

// ============================================
// MOCK DATA
// ============================================

/**
 * Default filters (clean state)
 */
const defaultFilters: JobFilters = {
  search: '',
  sortBy: 'newest_first',
};

/**
 * Filters with search applied
 */
const filtersWithSearch: JobFilters = {
  search: 'california',
  sortBy: 'newest_first',
};

/**
 * Filters with custom sort
 */
const filtersWithSort: JobFilters = {
  search: '',
  sortBy: 'most_records',
};

/**
 * Filters with both search and sort
 */
const filtersWithBoth: JobFilters = {
  search: 'high priority',
  sortBy: 'most_litigators',
};

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof JobsFilterPanel> = {
  title: 'Features/Results/JobsFilterPanel',
  component: JobsFilterPanel,
  tags: ['autodocs'],
  argTypes: {
    currentFilters: {
      description: 'Current filter state',
      table: {
        type: { summary: 'JobFilters' },
      },
    },
    onFilterChange: {
      description: 'Callback when filters change',
      action: 'filters-changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof JobsFilterPanel>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default state - no filters applied
 */
export const Default: Story = {
  args: {
    currentFilters: defaultFilters,
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * With search term entered
 */
export const WithSearch: Story = {
  args: {
    currentFilters: filtersWithSearch,
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * With custom sort selected
 */
export const WithSort: Story = {
  args: {
    currentFilters: filtersWithSort,
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * With both search and sort applied
 */
export const WithBothFilters: Story = {
  args: {
    currentFilters: filtersWithBoth,
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * Sort by newest first (default)
 */
export const SortNewestFirst: Story = {
  args: {
    currentFilters: {
      search: '',
      sortBy: 'newest_first',
    },
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * Sort by oldest first
 */
export const SortOldestFirst: Story = {
  args: {
    currentFilters: {
      search: '',
      sortBy: 'oldest_first',
    },
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * Sort by most records
 */
export const SortMostRecords: Story = {
  args: {
    currentFilters: {
      search: '',
      sortBy: 'most_records',
    },
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * Sort by most litigators
 */
export const SortMostLitigators: Story = {
  args: {
    currentFilters: {
      search: '',
      sortBy: 'most_litigators',
    },
    onFilterChange: (filters) => {
      console.log('Filters changed:', filters);
    },
  },
};

/**
 * Interactive - All filter options
 */
export const Interactive: Story = {
  render: function InteractiveStory() {
    const [filters, setFilters] = useState<JobFilters>(defaultFilters);

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Try different filter combinations
        </Typography>

        <JobsFilterPanel
          currentFilters={filters}
          onFilterChange={(newFilters) => {
            console.log('Filters changed:', newFilters);
            setFilters(newFilters);
          }}
        />

        <Paper sx={{ mt: 3, p: 2, bgcolor: palette.gray[50] }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Filter State:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
            {JSON.stringify(filters, null, 2)}
          </Typography>
        </Paper>
      </Box>
    );
  },
};

/**
 * With clear filters button visible
 */
export const WithClearButton: Story = {
  render: function WithClearButtonStory() {
    const [filters, setFilters] = useState<JobFilters>({
      search: 'test search',
      sortBy: 'most_records',
    });

    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Clear Filters button appears when filters are active
        </Typography>

        <JobsFilterPanel
          currentFilters={filters}
          onFilterChange={(newFilters) => {
            console.log('Filters changed:', newFilters);
            setFilters(newFilters);
          }}
        />

        <Paper sx={{ mt: 3, p: 2, bgcolor: palette.gray[50] }}>
          <Typography variant="subtitle2" gutterBottom>
            Active Filters:
          </Typography>
          <Typography variant="body2">
            Search: <strong>{filters.search || '(none)'}</strong>
          </Typography>
          <Typography variant="body2">
            Sort: <strong>{filters.sortBy}</strong>
          </Typography>
        </Paper>
      </Box>
    );
  },
};

/**
 * Search input with clear icon
 */
export const SearchWithClearIcon: Story = {
  render: function SearchWithClearIconStory() {
    const [filters, setFilters] = useState<JobFilters>({
      search: 'california leads',
      sortBy: 'newest_first',
    });

    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Clear icon appears in search field when text is entered
        </Typography>

        <JobsFilterPanel
          currentFilters={filters}
          onFilterChange={(newFilters) => {
            console.log('Filters changed:', newFilters);
            setFilters(newFilters);
          }}
        />
      </Box>
    );
  },
};

/**
 * All sort options demonstration
 */
const AllSortOptionsRender = () => {
  const sortOptions: SortOption[] = [
    'newest_first',
    'oldest_first',
    'most_records',
    'most_litigators',
  ];

  const [currentSort, setCurrentSort] = useState<SortOption>('newest_first');

  return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          All Sort Options
        </Typography>

        <JobsFilterPanel
          currentFilters={{
            search: '',
            sortBy: currentSort,
          }}
          onFilterChange={(filters) => {
            console.log('Sort changed to:', filters.sortBy);
            setCurrentSort(filters.sortBy);
          }}
        />

        <Paper sx={{ mt: 3, p: 2, bgcolor: palette.gray[50] }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Sort Options:
          </Typography>
          {sortOptions.map((option) => (
            <Typography
              key={option}
              variant="body2"
              sx={{
                fontWeight: option === currentSort ? 600 : 400,
                color: option === currentSort ? palette.accent[700] : 'text.primary',
              }}
            >
              {option === currentSort ? '→ ' : '  '}
              {option}
            </Typography>
          ))}
        </Paper>
      </Box>
  );
};

export const AllSortOptions: Story = {
  render: () => <AllSortOptionsRender />,
};

/**
 * Component in results page context
 */
export const InResultsPageContext: Story = {
  render: function InResultsPageContextStory() {
    const [filters, setFilters] = useState<JobFilters>({
      search: '',
      sortBy: 'newest_first',
    });

    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
            ETL Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and analyze results from completed ETL jobs
          </Typography>
        </Box>

        <JobsFilterPanel
          currentFilters={filters}
          onFilterChange={(newFilters) => {
            console.log('Filters changed:', newFilters);
            setFilters(newFilters);
          }}
        />

        <Box
          sx={{
            mt: 3,
            p: 4,
            border: `1px dashed ${palette.gray[300]}`,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Filtered jobs list would appear here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filters.search && `Searching for: "${filters.search}"`}
            {filters.search && ' | '}
            Sorted by: {filters.sortBy.replace('_', ' ')}
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Search:</strong> Filters jobs by name or ID
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Sort:</strong> Reorders jobs by date or record/litigator counts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>Clear Filters:</strong> Button appears when any non-default filter is active
          </Typography>
        </Box>
      </Box>
    );
  },
};
