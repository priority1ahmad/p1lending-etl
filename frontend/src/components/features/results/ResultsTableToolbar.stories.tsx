import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ResultsTableToolbar } from './ResultsTableToolbar';
import type { ColumnVisibility } from './ResultsTableToolbar';

// ============================================
// MOCK DATA
// ============================================

/**
 * Default column visibility (all visible)
 */
const defaultColumnVisibility: ColumnVisibility = {
  name: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  phone: true,
  email: true,
  litigator: true,
  processed: true,
};

/**
 * Minimal column visibility (only essential columns)
 */
const minimalColumnVisibility: ColumnVisibility = {
  name: true,
  address: false,
  city: false,
  state: true,
  zip: false,
  phone: true,
  email: true,
  litigator: true,
  processed: false,
};

// ============================================
// META CONFIGURATION
// ============================================

const meta: Meta<typeof ResultsTableToolbar> = {
  title: 'Features/Results/ResultsTableToolbar',
  component: ResultsTableToolbar,
  tags: ['autodocs'],
  argTypes: {
    searchQuery: {
      control: 'text',
      description: 'Search query string for filtering records',
    },
    onSearchChange: {
      description: 'Callback when search query changes',
      action: 'search-change',
    },
    excludeLitigators: {
      control: 'boolean',
      description: 'Whether litigators are excluded from results',
    },
    onToggleExclude: {
      description: 'Callback when exclude litigators toggle is changed',
      action: 'toggle-exclude',
    },
    onExport: {
      description: 'Callback when export button is clicked',
      action: 'export',
    },
    isExporting: {
      control: 'boolean',
      description: 'Whether CSV export is in progress',
    },
    columnVisibility: {
      description: 'Column visibility configuration object',
      table: {
        type: { summary: 'ColumnVisibility' },
      },
    },
    onColumnVisibilityChange: {
      description: 'Callback when column visibility changes',
      action: 'column-visibility-change',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResultsTableToolbar>;

// ============================================
// STORY VARIANTS
// ============================================

/**
 * Default toolbar with all features enabled
 */
export const Default: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query) => {
      console.log('Search query:', query);
    },
    excludeLitigators: false,
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
    },
    onExport: () => {
      console.log('Export CSV clicked');
      alert('Starting CSV export...');
    },
    isExporting: false,
    columnVisibility: defaultColumnVisibility,
    onColumnVisibilityChange: (visibility) => {
      console.log('Column visibility changed:', visibility);
    },
  },
};

/**
 * With search query entered
 */
export const WithSearchQuery: Story = {
  args: {
    searchQuery: 'John Smith',
    onSearchChange: (query) => {
      console.log('Search query:', query);
    },
    excludeLitigators: false,
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
    },
    onExport: () => {
      console.log('Export CSV clicked');
    },
    isExporting: false,
    columnVisibility: defaultColumnVisibility,
    onColumnVisibilityChange: (visibility) => {
      console.log('Column visibility changed:', visibility);
    },
  },
};

/**
 * With exclude litigators enabled
 */
export const ExcludingLitigators: Story = {
  args: {
    searchQuery: '',
    onSearchChange: () => {},
    excludeLitigators: true,
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
      alert(exclude ? 'Excluding litigators from results' : 'Showing all records');
    },
    onExport: () => {
      console.log('Export CSV clicked');
    },
    isExporting: false,
    columnVisibility: defaultColumnVisibility,
    onColumnVisibilityChange: () => {},
  },
};

/**
 * Export in progress state
 */
export const Exporting: Story = {
  args: {
    searchQuery: '',
    onSearchChange: () => {},
    excludeLitigators: false,
    onToggleExclude: () => {},
    onExport: () => {},
    isExporting: true,
    columnVisibility: defaultColumnVisibility,
    onColumnVisibilityChange: () => {},
  },
};

/**
 * Without column visibility controls
 * Useful for simpler use cases
 */
export const WithoutColumnControls: Story = {
  args: {
    searchQuery: '',
    onSearchChange: (query) => {
      console.log('Search query:', query);
    },
    excludeLitigators: false,
    onToggleExclude: (exclude) => {
      console.log('Toggle exclude litigators:', exclude);
    },
    onExport: () => {
      console.log('Export CSV clicked');
    },
    isExporting: false,
    columnVisibility: undefined,
    onColumnVisibilityChange: undefined,
  },
};

/**
 * With minimal columns visible
 */
export const MinimalColumns: Story = {
  args: {
    searchQuery: '',
    onSearchChange: () => {},
    excludeLitigators: false,
    onToggleExclude: () => {},
    onExport: () => {},
    isExporting: false,
    columnVisibility: minimalColumnVisibility,
    onColumnVisibilityChange: (visibility) => {
      console.log('Column visibility changed:', visibility);
    },
  },
};

/**
 * Interactive demo with state management
 */
const InteractiveRender = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(defaultColumnVisibility);

  const handleExport = () => {
    setIsExporting(true);
    console.log('Starting export...');
    setTimeout(() => {
      setIsExporting(false);
      alert('Export complete!');
    }, 2000);
  };

  return (
    <Box>
      <ResultsTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        excludeLitigators={excludeLitigators}
        onToggleExclude={setExcludeLitigators}
        onExport={handleExport}
        isExporting={isExporting}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Current State:</strong>
        </Typography>
        <Typography variant="caption" component="pre" sx={{ display: 'block', fontFamily: 'monospace' }}>
          {JSON.stringify(
            {
              searchQuery,
              excludeLitigators,
              isExporting,
              columnVisibility,
            },
            null,
            2
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveRender />,
};

/**
 * Component in results page context
 */
const InResultsPageContextRender = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [excludeLitigators, setExcludeLitigators] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(defaultColumnVisibility);

  return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
            ETL Results
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Search, filter, and export your processed records
          </Typography>
        </Box>

        <ResultsTableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          excludeLitigators={excludeLitigators}
          onToggleExclude={setExcludeLitigators}
          onExport={() => {
            console.log('Export CSV clicked');
            alert('Starting CSV export...');
          }}
          isExporting={false}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Search:</strong> Filters records by name, address, phone, or email
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Column Visibility:</strong> Click the column icon to show/hide table columns
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>Export:</strong> Downloads visible records as CSV (respects filters and column visibility)
          </Typography>
        </Box>
      </Box>
  );
};

export const InResultsPageContext: Story = {
  render: () => <InResultsPageContextRender />,
};
