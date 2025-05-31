
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LaundryItem {
  id: string;
  name: string;
  price_per_item: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  price_per_kg: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useLaundryItems = () => {
  return useQuery({
    queryKey: ['laundryItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('laundry_items')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as LaundryItem[];
    },
  });
};

export const useServiceTypes = () => {
  return useQuery({
    queryKey: ['serviceTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ServiceType[];
    },
  });
};

export const useUpdateLaundryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LaundryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('laundry_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laundryItems'] });
    },
  });
};

export const useUpdateServiceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceType> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
    },
  });
};
