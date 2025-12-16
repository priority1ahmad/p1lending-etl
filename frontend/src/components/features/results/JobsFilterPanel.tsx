/**
 * JobsFilterPanel Component
 * Filtering controls for jobs list
 */

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

export type SortOption =
  | 'newest_first'
  | 'oldest_first'
  | 'most_records'
  | 'most_litigators';

export interface JobFilters {
  search: string;
  sortBy: SortOption;
}

export interface JobsFilterPanelProps {
  currentFilters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
}

export function JobsFilterPanel({
  currentFilters,
  onFilterChange,
}: JobsFilterPanelProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({
      ...currentFilters,
      search: value,
    });
  };

  const handleSortChange = (value: SortOption) => {
    onFilterChange({
      ...currentFilters,
      sortBy: value,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      sortBy: 'newest_first',
    });
  };

  const hasActiveFilters =
    currentFilters.search !== '' ||
    currentFilters.sortBy !== 'newest_first';

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="Search jobs..."
        value={currentFilters.search}
        onChange={(e) => handleSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          endAdornment: currentFilters.search && (
            <IconButton
              size="small"
              onClick={() => handleSearchChange('')}
            >
              <Clear />
            </IconButton>
          ),
        }}
        sx={{ flexGrow: 1, maxWidth: 300 }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={currentFilters.sortBy}
          label="Sort By"
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
        >
          <MenuItem value="newest_first">Newest First</MenuItem>
          <MenuItem value="oldest_first">Oldest First</MenuItem>
          <MenuItem value="most_records">Most Records</MenuItem>
          <MenuItem value="most_litigators">Most Litigators</MenuItem>
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          variant="outlined"
          size="small"
          onClick={handleClearFilters}
          startIcon={<Clear />}
        >
          Clear Filters
        </Button>
      )}
    </Box>
  );
}

export default JobsFilterPanel;
