/**
 * Results Feature Components
 * Barrel export for all ETL results-related components
 */

// Existing exports
export { ResultsStatsBar } from './ResultsStatsBar';
export type { ResultsStatsBarProps, ResultsStats } from './ResultsStatsBar';

export { JobsListCard } from './JobsListCard';
export type { JobsListCardProps, JobItem } from './JobsListCard';

export { ResultsDataTable } from './ResultsDataTable';
export type { ResultsDataTableProps, ResultRecord } from './ResultsDataTable';

// New exports
export { ResultsMetricCard } from './ResultsMetricCard';
export type { ResultsMetricCardProps } from './ResultsMetricCard';

export { default as ResultsOverviewCharts } from './ResultsOverviewCharts';
export type { JobStats } from './ResultsOverviewCharts';

export { JobsFilterPanel } from './JobsFilterPanel';
export type { JobFilters, SortOption } from './JobsFilterPanel';

export { ResultsTableToolbar } from './ResultsTableToolbar';
export type { ColumnVisibility } from './ResultsTableToolbar';

export { QuickStatsWidget } from './QuickStatsWidget';
export type { QuickStatsWidgetProps } from './QuickStatsWidget';

export { CompactJobsList } from './CompactJobsList';
export type { CompactJobsListProps, CompactJob } from './CompactJobsList';

// V3 Airtable-inspired components
export { JobCard } from './JobCard';
export type { JobCardProps } from './JobCard';

export { JobSidebar } from './JobSidebar';
export type { JobSidebarProps, SidebarJob } from './JobSidebar';

export { ResultsHeader } from './ResultsHeader';
export type { ResultsHeaderProps } from './ResultsHeader';

export { AirtableTable } from './AirtableTable';
export type { AirtableTableProps, TableRecord } from './AirtableTable';

export { TableFooter } from './TableFooter';
export type { TableFooterProps } from './TableFooter';
