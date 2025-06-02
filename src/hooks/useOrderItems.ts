
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
  payment_pending: boolean;
  created_at: string;
  updated_at: string;
}

export const useOrderItems = (orderId: string) => {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
};

export const useCreateOrderItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderItems: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['order-items', variables[0].order_id] });
      }
    },
  });
};

export const useUpdateOrderItemPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payment_pending }: { id: string; payment_pending: boolean }) => {
      const { data, error } = await supabase
        .from('order_items')
        .update({ payment_pending })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['order-items', data.order_id] });
    },
  });
};
