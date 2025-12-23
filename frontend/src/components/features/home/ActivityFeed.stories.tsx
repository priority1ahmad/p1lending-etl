import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { ActivityFeed, type ActivityItem, type ActivityType } from './ActivityFeed';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Features/Home/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

// Helper to create timestamps
const now = new Date();
const createTimestamp = (secondsAgo: number) =>
  new Date(now.getTime() - secondsAgo * 1000).toISOString();

// Sample activities showing a typical ETL job flow
const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'start',
    message: 'ETL job started',
    timestamp: createTimestamp(120),
    details: 'Script: Daily Leads - California',
  },
  {
    id: '2',
    type: 'snowflake',
    message: 'Querying Snowflake database',
    timestamp: createTimestamp(115),
    details: 'Fetching unprocessed leads from bulk_property_data_private_share_usa',
  },
  {
    id: '3',
    type: 'info',
    message: 'Query complete',
    timestamp: createTimestamp(105),
    count: 2847,
    details: 'Found 2,847 records matching criteria',
  },
  {
    id: '4',
    type: 'batch',
    message: 'Starting batch processing',
    timestamp: createTimestamp(100),
    details: 'Processing in 12 batches of 250 records',
  },
  {
    id: '5',
    type: 'idicore',
    message: 'idiCORE enrichment - Batch 1/12',
    timestamp: createTimestamp(90),
    count: 250,
  },
  {
    id: '6',
    type: 'success',
    message: 'Enriched records with phone/email data',
    timestamp: createTimestamp(80),
    count: 237,
    details: '13 records had no match',
  },
  {
    id: '7',
    type: 'ccc',
    message: 'CCC Litigator API check - Batch 1/12',
    timestamp: createTimestamp(75),
  },
  {
    id: '8',
    type: 'ccc',
    message: 'Litigators identified',
    timestamp: createTimestamp(70),
    count: 18,
    details: 'Records flagged as potential litigators',
  },
  {
    id: '9',
    type: 'dnc',
    message: 'DNC database validation - Batch 1/12',
    timestamp: createTimestamp(65),
  },
  {
    id: '10',
    type: 'dnc',
    message: 'DNC matches found',
    timestamp: createTimestamp(60),
    count: 12,
    details: 'Records on Do Not Call registry',
  },
  {
    id: '11',
    type: 'idicore',
    message: 'idiCORE enrichment - Batch 2/12',
    timestamp: createTimestamp(55),
    count: 250,
  },
  {
    id: '12',
    type: 'success',
    message: 'Batch 2 complete',
    timestamp: createTimestamp(45),
    count: 500,
    details: 'Running total: 500 records processed',
  },
];

const COMPLETED_ACTIVITIES: ActivityItem[] = [
  ...SAMPLE_ACTIVITIES,
  {
    id: '13',
    type: 'upload',
    message: 'Uploading results to Snowflake',
    timestamp: createTimestamp(20),
    details: 'Writing to MASTER_PROCESSED_DB table',
  },
  {
    id: '14',
    type: 'success',
    message: 'Upload complete',
    timestamp: createTimestamp(10),
    count: 2847,
  },
  {
    id: '15',
    type: 'success',
    message: 'ETL job completed successfully',
    timestamp: createTimestamp(5),
    details: 'Total time: 1m 55s • Clean: 2,602 • Litigator: 156 • DNC: 89',
  },
];

/**
 * Default state with sample activities
 */
export const Default: Story = {
  args: {
    activities: SAMPLE_ACTIVITIES,
  },
};

/**
 * Completed job with all activity types
 */
export const Completed: Story = {
  args: {
    activities: COMPLETED_ACTIVITIES,
  },
};

/**
 * Empty state (no job running)
 */
export const Empty: Story = {
  args: {
    activities: [],
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    activities: [],
    isLoading: true,
  },
};

/**
 * Compact mode (for smaller spaces)
 */
export const Compact: Story = {
  args: {
    activities: SAMPLE_ACTIVITIES,
    compact: true,
    maxHeight: 200,
  },
};

/**
 * Without timestamps
 */
export const NoTimestamps: Story = {
  args: {
    activities: SAMPLE_ACTIVITIES,
    showTimestamps: false,
  },
};

/**
 * Error-heavy feed (showing issues)
 */
export const WithErrors: Story = {
  args: {
    activities: [
      {
        id: '1',
        type: 'start',
        message: 'ETL job started',
        timestamp: createTimestamp(60),
        details: 'Script: Weekly Refinance Pool',
      },
      {
        id: '2',
        type: 'snowflake',
        message: 'Querying Snowflake database',
        timestamp: createTimestamp(55),
      },
      {
        id: '3',
        type: 'warning',
        message: 'Slow query detected',
        timestamp: createTimestamp(45),
        details: 'Query took 12.3s (expected <5s)',
      },
      {
        id: '4',
        type: 'info',
        message: 'Query complete',
        timestamp: createTimestamp(40),
        count: 5000,
      },
      {
        id: '5',
        type: 'idicore',
        message: 'idiCORE enrichment - Batch 1/20',
        timestamp: createTimestamp(35),
      },
      {
        id: '6',
        type: 'error',
        message: 'idiCORE API timeout',
        timestamp: createTimestamp(30),
        details: 'Retrying in 5 seconds...',
      },
      {
        id: '7',
        type: 'warning',
        message: 'Retry attempt 1/3',
        timestamp: createTimestamp(25),
      },
      {
        id: '8',
        type: 'success',
        message: 'idiCORE API recovered',
        timestamp: createTimestamp(20),
      },
      {
        id: '9',
        type: 'error',
        message: 'CCC API rate limit exceeded',
        timestamp: createTimestamp(15),
        details: 'Waiting 30 seconds before retry',
      },
    ],
  },
};

/**
 * Short height with scrolling
 */
export const ScrollingFeed: Story = {
  args: {
    activities: COMPLETED_ACTIVITIES,
    maxHeight: 180,
  },
};

/**
 * Live simulation with auto-updating activities
 */
export const LiveSimulation: Story = {
  render: function LiveDemo() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [step, setStep] = useState(0);

    const simulationSteps: Omit<ActivityItem, 'id' | 'timestamp'>[] = [
      {
        type: 'start',
        message: 'ETL job started',
        details: 'Script: Daily Leads - California',
      },
      {
        type: 'snowflake',
        message: 'Querying Snowflake database',
        details: 'Connecting to bulk_property_data_private_share_usa',
      },
      {
        type: 'info',
        message: 'Query executing...',
        details: 'Filtering by criteria: state=CA, processed=false',
      },
      {
        type: 'success',
        message: 'Query complete',
        count: 1500,
        details: 'Found 1,500 unprocessed records',
      },
      {
        type: 'batch',
        message: 'Starting batch processing',
        details: 'Processing in 6 batches of 250 records',
      },
      {
        type: 'idicore',
        message: 'idiCORE enrichment - Batch 1/6',
        count: 250,
      },
      {
        type: 'success',
        message: 'Phone/email data enriched',
        count: 238,
        details: '12 records had no match',
      },
      {
        type: 'ccc',
        message: 'CCC Litigator check - Batch 1/6',
      },
      {
        type: 'ccc',
        message: 'Litigators identified',
        count: 15,
      },
      {
        type: 'dnc',
        message: 'DNC validation - Batch 1/6',
      },
      {
        type: 'dnc',
        message: 'DNC matches found',
        count: 8,
      },
      {
        type: 'idicore',
        message: 'idiCORE enrichment - Batch 2/6',
        count: 250,
      },
      {
        type: 'success',
        message: 'Batch 2 enrichment complete',
        count: 245,
      },
      {
        type: 'ccc',
        message: 'CCC Litigator check - Batch 2/6',
      },
      {
        type: 'ccc',
        message: 'Litigators identified',
        count: 12,
      },
      {
        type: 'dnc',
        message: 'DNC validation - Batch 2/6',
      },
      {
        type: 'success',
        message: 'Batch 2 complete',
        count: 500,
        details: 'Running total: 500 records processed',
      },
      {
        type: 'upload',
        message: 'Uploading to Snowflake',
        details: 'Writing to MASTER_PROCESSED_DB',
      },
      {
        type: 'success',
        message: 'ETL job completed!',
        count: 1500,
        details: 'Clean: 1,285 • Litigator: 127 • DNC: 88',
      },
    ];

    useEffect(() => {
      if (!isRunning || step >= simulationSteps.length) {
        if (step >= simulationSteps.length) {
          setIsRunning(false);
        }
        return;
      }

      const delay = Math.random() * 800 + 400; // 400-1200ms random delay
      const timeout = setTimeout(() => {
        const newActivity: ActivityItem = {
          id: `activity-${step}`,
          timestamp: new Date().toISOString(),
          ...simulationSteps[step],
        };
        setActivities((prev) => [...prev, newActivity]);
        setStep((s) => s + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }, [isRunning, step]);

    const handleStart = () => {
      setActivities([]);
      setStep(0);
      setIsRunning(true);
    };

    const handleStop = () => {
      setIsRunning(false);
      if (activities.length > 0) {
        setActivities((prev) => [
          ...prev,
          {
            id: `stop-${Date.now()}`,
            type: 'stop' as ActivityType,
            message: 'Job cancelled by user',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    const handleClear = () => {
      setActivities([]);
      setStep(0);
      setIsRunning(false);
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStart}
            disabled={isRunning}
          >
            Start Simulation
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleStop}
            disabled={!isRunning}
          >
            Stop
          </Button>
          <Button variant="outlined" onClick={handleClear} disabled={isRunning}>
            Clear
          </Button>
        </Box>
        <ActivityFeed
          activities={activities}
          title="Live Activity"
          maxHeight={350}
          autoScroll
        />
      </Box>
    );
  },
};

/**
 * Side-by-side comparison of normal and compact modes
 */
export const ComparisonView: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      <Box>
        <Box sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>Normal Mode</Box>
        <ActivityFeed activities={SAMPLE_ACTIVITIES.slice(0, 6)} maxHeight={280} />
      </Box>
      <Box>
        <Box sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>Compact Mode</Box>
        <ActivityFeed
          activities={SAMPLE_ACTIVITIES.slice(0, 6)}
          maxHeight={280}
          compact
        />
      </Box>
    </Box>
  ),
};
