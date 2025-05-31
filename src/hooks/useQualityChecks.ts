
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QualityCheck {
  id: string;
  order_id?: string;
  order_number: string;
  customer_name: string;
  check_type: 'pre-wash' | 'post-wash' | 'pre-dry' | 'post-dry' | 'final';
  status: 'pending' | 'passed' | 'failed' | 'review';
  score: number;
  issues?: string[];
  notes?: string;
  inspector?: string;
  checked_at: string;
  created_at: string;
}

export const useQualityChecks = () => {
  return useQuery({
    queryKey: ['quality_checks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_checks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as QualityCheck[];
    },
  });
};

export const useCreateQualityCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qualityCheck: Omit<QualityCheck, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('quality_checks')
        .insert([qualityCheck])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality_checks'] });
    },
  });
};
