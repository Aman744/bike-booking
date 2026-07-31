import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ISettings } from 'shared';
import { toast } from 'sonner';

export const useSettings = () => {
  const queryClient = useQueryClient();

  // Query to fetch global system settings (shop name, logo, work hours, etc.)
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data.data.settings as ISettings;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache limit
  });

  // Mutation to update system settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ISettings>) => {
      const { data } = await api.put('/settings', newSettings);
      return data.data.settings as ISettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      toast.success('Dealership configurations saved successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Settings update failed');
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};

export default useSettings;
