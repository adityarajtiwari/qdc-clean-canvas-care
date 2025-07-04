import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
  tags?: string[];
  price?: number; // Added back for item-based pricing
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  items: string;
  items_detail?: Record<string, OrderItem>;
  status: 'received' | 'processing' | 'ready' | 'completed' | 'delayed';
  priority: 'low' | 'normal' | 'urgent';
  amount: number;
  quality_score: number;
  date_received: string;
  due_date: string;
  completed_date?: string;
  pricing_type: 'item' | 'kg';
  service_type_id?: string;
  total_weight?: number;
  subtotal?: number;
  discount?: number;
  discount_type?: 'percentage' | 'fixed';
  created_at: string;
  updated_at: string;
  has_pending_payments?: boolean;
}

export const useOrders = (page: number = 1, limit: number = 10, searchTerm?: string, statusFilter?: string, paymentFilter?: string) => {
  return useQuery({
    queryKey: ['orders', page, limit, searchTerm, statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items!left (
            id,
            payment_pending
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,order_number.ilike.%${searchTerm}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Transform the data to match our Order interface and filter by payment status
      let transformedData: Order[] = (data || []).map(order => {
        const orderItems = order.order_items || [];
        const hasPendingPayments = order.pricing_type === 'item' && orderItems.some((item: any) => item.payment_pending);
        
        return {
          ...order,
          status: order.status as Order['status'],
          priority: order.priority as Order['priority'],
          pricing_type: (order.pricing_type as Order['pricing_type']) || 'item',
          discount_type: (order.discount_type as Order['discount_type']) || 'percentage',
          items_detail: (order.items_detail as unknown as Record<string, OrderItem>) || {},
          has_pending_payments: hasPendingPayments
        };
      });

      // Apply payment filter after transformation
      if (paymentFilter && paymentFilter !== 'all') {
        if (paymentFilter === 'pending') {
          transformedData = transformedData.filter(order => 
            order.pricing_type === 'item' && order.has_pending_payments
          );
        } else if (paymentFilter === 'completed') {
          transformedData = transformedData.filter(order => 
            order.pricing_type === 'kg' || !order.has_pending_payments
          );
        }
      }

      // Apply pagination after filtering
      const totalFilteredCount = transformedData.length;
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedData = transformedData.slice(from, to);

      return { 
        orders: paginatedData, 
        totalCount: totalFilteredCount,
        totalPages: Math.ceil(totalFilteredCount / limit)
      };
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
      // Create the order first - don't store items_detail for item-based pricing
      const orderData = {
        ...order,
        order_number: '', // Will be auto-generated by the trigger
        // Only store items_detail for kg-based pricing (for notes/tags on weight-based items)
        items_detail: order.pricing_type === 'kg' ? (order.items_detail as any || {}) : {}
      };

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // If this is an item-based order, create individual order items
      if (order.pricing_type === 'item' && order.items_detail && Object.keys(order.items_detail).length > 0) {
        const orderItems = Object.values(order.items_detail).map(item => ({
          order_id: createdOrder.id,
          item_name: item.name,
          quantity: item.quantity,
          price_per_item: item.price || 0,
          total_price: (item.quantity * (item.price || 0)),
          payment_pending: true,
          notes: item.notes || null,
          tags: item.tags || []
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          // Don't throw error here to avoid breaking order creation
        }
      }

      return createdOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Order> & { id: string }) => {
      // Separate items_detail from other updates
      const { items_detail, ...orderUpdates } = updates;
      
      // Update the main order record - only store items_detail for kg-based pricing
      const updateData = {
        ...orderUpdates,
        items_detail: updates.pricing_type === 'kg' ? (items_detail as any || {}) : {}
      };

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If this is an item-based order and we have items_detail, update order_items table
      if (updates.pricing_type === 'item' && items_detail && Object.keys(items_detail).length > 0) {
        // Delete existing order items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', id);

        if (deleteError) {
          console.error('Error deleting existing order items:', deleteError);
        }

        // Insert updated order items
        const orderItems = Object.values(items_detail).map(item => ({
          order_id: id,
          item_name: item.name,
          quantity: item.quantity,
          price_per_item: item.price || 0,
          total_price: (item.quantity * (item.price || 0)),
          payment_pending: true,
          notes: item.notes || null,
          tags: item.tags || []
        }));

        const { error: insertError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (insertError) {
          console.error('Error inserting updated order items:', insertError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-items'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const updates: any = { status };
      
      // Set completed_date when status changes to completed
      if (status === 'completed') {
        updates.completed_date = new Date().toISOString();
      } else {
        updates.completed_date = null;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
