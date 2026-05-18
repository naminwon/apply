import { useQuery } from '@tanstack/react-query';
import { fetchDashboardDataOrThrow } from '../api/client';

export const useDashboardData = () =>
  useQuery({
    queryKey: ['dashboard', 'all'] as const,
    queryFn: () => fetchDashboardDataOrThrow('all'),
  });
