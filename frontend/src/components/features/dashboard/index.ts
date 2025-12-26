/**
 * Dashboard Components
 * Export all dashboard-specific UI components
 */

export { DashboardMetricCard } from './DashboardMetricCard';
export type { DashboardMetricCardProps } from './DashboardMetricCard';

export { QuickActionCard } from './QuickActionCard';
export type { QuickActionCardProps } from './QuickActionCard';

export { ProcessingTrendsChart } from './ProcessingTrendsChart';
export type {
  ProcessingTrendsChartProps,
  TrendDataPoint,
} from './ProcessingTrendsChart';

export { ComplianceDonutChart } from './ComplianceDonutChart';
export type {
  ComplianceDonutChartProps,
  ComplianceData,
} from './ComplianceDonutChart';

export { DashboardSection } from './DashboardSection';
export type { DashboardSectionProps } from './DashboardSection';

export { DateRangeSelector } from './DateRangeSelector';
export type { DateRangeSelectorProps, DateRange } from './DateRangeSelector';
