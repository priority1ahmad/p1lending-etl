/**
 * ComprehensiveDashboard Stories
 * Storybook stories for the main dashboard layout
 */

import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';

import ComprehensiveDashboard from './ComprehensiveDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const meta: Meta<typeof ComprehensiveDashboard> = {
  title: 'Pages/ComprehensiveDashboard',
  component: ComprehensiveDashboard,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>
            <Story />
          </SnackbarProvider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComprehensiveDashboard>;

/**
 * Main dashboard layout with all sections
 * Shows overview metrics, KPIs, analytics, and quick actions
 */
export const Default: Story = {};

/**
 * Dashboard with loading state
 */
export const Loading: Story = {
  decorators: [
    (Story) => (
      <BrowserRouter>
        <QueryClientProvider
          client={new QueryClient({
            defaultOptions: {
              queries: {
                queryFn: async () => {
                  await new Promise((resolve) => setTimeout(resolve, 10000));
                  return [];
                },
              },
            },
          })}
        >
          <SnackbarProvider>
            <Story />
          </SnackbarProvider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
};
