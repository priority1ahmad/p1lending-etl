/**
 * useDashboardData Hook
 * Consolidates all data fetching for the Dashboard page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '../../services/api/scripts';
import { jobsApi } from '../../services/api/jobs';
import type { ETLJob, JobCreate, JobPreview } from '../../services/api/jobs';

export interface UseDashboardDataReturn {
  // Scripts
  scripts: ReturnType<typeof scriptsApi.list> extends Promise<infer T> ? T : never[] | undefined;
  scriptsLoading: boolean;

  // Jobs
  latestJob: ETLJob | null | undefined;
  jobHistory: ETLJob[];
  jobHistoryMessage?: string;
  jobsLoading: boolean;
  refetchHistory: () => void;

  // Mutations
  createJob: ReturnType<typeof useMutation<ETLJob, Error, JobCreate>>;
  cancelJob: ReturnType<typeof useMutation<ETLJob, Error, string>>;
  previewJob: ReturnType<typeof useMutation<JobPreview[], Error, { scriptIds: string[]; rowLimit?: number }>>;

  // Log file
  fetchLogFile: (jobId: string) => Promise<{ content: string }>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const queryClient = useQueryClient();

  // Fetch scripts
  const { data: scripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptsApi.list(),
  });

  // Fetch latest job (for current status)
  const { data: latestJob } = useQuery({
    queryKey: ['jobs', 'latest'],
    queryFn: async () => {
      const response = await jobsApi.list(0, 1);
      return response.jobs.length > 0 ? response.jobs[0] : null;
    },
    refetchInterval: (query) => {
      const job = query.state.data as ETLJob | null;
      return job?.status === 'running' ? 2000 : false;
    },
  });

  // Fetch job history
  const {
    data: jobHistoryResponse,
    isLoading: jobsLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['jobs', 'history'],
    queryFn: async () => {
      return await jobsApi.list(0, 50);
    },
    refetchInterval: 5000,
  });

  const jobHistory = jobHistoryResponse?.jobs || [];
  const jobHistoryMessage = jobHistoryResponse?.message;

  // Create job mutation
  const createJob = useMutation({
    mutationFn: (data: JobCreate) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      refetchHistory();
    },
  });

  // Cancel job mutation
  const cancelJob = useMutation({
    mutationFn: (id: string) => jobsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Preview job mutation
  const previewJob = useMutation({
    mutationFn: ({ scriptIds, rowLimit }: { scriptIds: string[]; rowLimit?: number }) =>
      jobsApi.preview(scriptIds, rowLimit),
    onSuccess: () => {
      refetchHistory();
    },
  });

  // Fetch log file
  const fetchLogFile = async (jobId: string) => {
    return await jobsApi.getLogFile(jobId);
  };

  return {
    scripts: scripts as UseDashboardDataReturn['scripts'],
    scriptsLoading,
    latestJob,
    jobHistory,
    jobHistoryMessage,
    jobsLoading,
    refetchHistory,
    createJob,
    cancelJob,
    previewJob,
    fetchLogFile,
  };
}

export default useDashboardData;
