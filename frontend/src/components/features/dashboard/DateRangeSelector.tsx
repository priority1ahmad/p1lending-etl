/**
 * DateRangeSelector Component
 * Button group for selecting time ranges for dashboard analytics
 */

import { Box, Button, type ButtonProps } from '@mui/material';
import { palette, textColors, borderColors } from '../../../theme';

export type DateRange = 'today' | 'week' | 'month' | 'year';

export interface DateRangeSelectorProps {
  /** Currently selected range */
  value: DateRange;
  /** Change handler */
  onChange: (range: DateRange) => void;
  /** Disabled state */
  disabled?: boolean;
}

const dateRangeOptions = [
  { value: 'today' as const, label: 'Today' },
  { value: 'week' as const, label: 'Last 7 Days' },
  { value: 'month' as const, label: 'Last 30 Days' },
  { value: 'year' as const, label: 'Last Year' },
];

/**
 * Date range selector button group
 *
 * @example
 * const [range, setRange] = useState<DateRange>('week');
 * <DateRangeSelector value={range} onChange={setRange} />
 */
export function DateRangeSelector({
  value,
  onChange,
  disabled = false,
}: DateRangeSelectorProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: palette.gray[50],
        border: `1px solid ${borderColors.light}`,
        width: 'fit-content',
      }}
    >
      {dateRangeOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <Button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 0.75,
              fontSize: '0.8125rem',
              fontWeight: isSelected ? 600 : 500,
              textTransform: 'none',
              transition: 'all 0.15s ease',
              backgroundColor: isSelected ? palette.accent[500] : 'transparent',
              color: isSelected ? '#FFFFFF' : textColors.secondary,
              border: 'none',
              '&:hover': {
                backgroundColor: isSelected
                  ? palette.accent[600]
                  : palette.gray[100],
              },
              '&:disabled': {
                opacity: 0.5,
              },
            } as ButtonProps['sx']}
          >
            {option.label}
          </Button>
        );
      })}
    </Box>
  );
}

export default DateRangeSelector;
