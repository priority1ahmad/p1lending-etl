/**
 * ResultsPageV3 Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResultsPageV3 } from './ResultsPageV3';

// Mock the API
vi.mock('../services/api/results', () => ({
  resultsApi: {
    listJobs: vi.fn().mockResolvedValue({
      jobs: [
        {
          job_id: 'job-1',
          job_name: 'Test Job',
          record_count: 100,
          last_processed: '2024-01-15T10:30:00Z',
        },
      ],
    }),
    getJobResults: vi.fn().mockResolvedValue({
      records: [],
      total: 100,
      litigator_count: 5,
    }),
    exportJobResults: vi.fn(),
  },
}));

// Mock the lodasoftImport API
vi.mock('../services/api/lodasoftImport', () => ({
  lodasoftImportApi: {
    startImport: vi.fn().mockResolvedValue({ import_id: 'import-1' }),
    getImportStatus: vi.fn().mockResolvedValue({ status: 'completed' }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ResultsPageV3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Start Import button in ImportDialog when opened', async () => {
    render(<ResultsPageV3 />, { wrapper: createWrapper() });

    // Wait for jobs to load and select first job
    await waitFor(() => {
      expect(screen.getByText('Test Job')).toBeInTheDocument();
    });

    // Click on the job to select it
    fireEvent.click(screen.getByText('Test Job'));

    // Wait for the Import button to appear and click it
    await waitFor(() => {
      expect(screen.getByText('Import to Lodasoft')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Import to Lodasoft'));

    // Verify the dialog shows the Start Import button
    await waitFor(() => {
      expect(screen.getByText('Import to Lodasoft CRM')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start import/i })).toBeInTheDocument();
    });
  });
});
