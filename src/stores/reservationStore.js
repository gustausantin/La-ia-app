import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../lib/supabase.js';
import { log } from '../utils/logger.js';

// Store de reservas
export const useReservationStore = create()(
  devtools(
    (set, get) => ({
      // === ESTADO DE RESERVAS ===
      isLoading: false,
      error: null,
      
      // === RESERVAS ===
      reservations: [],
      filteredReservations: [],
      selectedDate: new Date().toISOString().split('T')[0],
      
      // === DISPONIBILIDAD ===
      availability: {},
      timeSlots: [],
      
      // === FILTROS ===
      filters: {
        status: 'all',
        timeRange: 'today',
        table: 'all',
        party_size: 'all',
      },
      
      // === CONFIGURACIÓN ===
      settings: {
        slotDuration: 30, // minutos
        maxAdvanceBooking: 90, // días
        minAdvanceBooking: 1, // horas
        maxPartySize: 12,
        bufferTime: 15, // minutos entre reservas
      },
      
      // === MÉTRICAS ===
      metrics: {
        todayReservations: 0,
        weekReservations: 0,
        monthReservations: 0,
        averagePartySize: 0,
        noShowRate: 0,
        cancellationRate: 0,
      },
      
      // === ACCIONES PRINCIPALES ===
      loadReservations: async (date = null) => {
        set({ isLoading: true, error: null });
        
        try {
          const targetDate = date || get().selectedDate;
          log.info('📅 Loading reservations for:', targetDate);
          
          const { data, error } = await supabase
            .from('reservations')
            .select(`
              *,
              customer:customers(*),
              table:tables(*)
            `)
            .gte('date', targetDate)
            .lt('date', new Date(new Date(targetDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('time', { ascending: true });
          
          if (error) throw error;
          
          set({ 
            reservations: data || [],
            filteredReservations: data || [],
          });
          
          // Cargar disponibilidad para el día
          await get().loadAvailability(targetDate);
          
          log.info('✅ Reservations loaded');
          
        } catch (error) {
          log.error('❌ Failed to load reservations:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // === CREAR RESERVA ===
      createReservation: async (reservationData) => {
        try {
          log.info('📝 Creating new reservation');
          
          // Usar RPC validada para evitar solapes
          const payload = {
            reservation_date: reservationData.reservation_date || reservationData.date,
            reservation_time: reservationData.reservation_time || reservationData.time,
            party_size: reservationData.party_size,
            table_id: reservationData.table_id || null,
            status: reservationData.status || 'pending',
            customer_name: reservationData.customer_name,
            customer_email: reservationData.customer_email,
            customer_phone: reservationData.customer_phone,
            channel: reservationData.channel || 'manual',
            source: reservationData.source || 'manual',
            special_requests: reservationData.special_requests || null,
            notes: reservationData.notes || null
          };

          const { data: rpcData, error: rpcError } = await supabase
            .rpc('create_reservation_validated', {
              p_restaurant_id: reservationData.restaurant_id,
              p_payload: payload,
              p_slot_minutes: 90
            });

          if (rpcError) throw rpcError;
          if (!rpcData?.success) {
            throw new Error(rpcData?.error || 'No se pudo crear la reserva');
          }

          const data = rpcData.reservation;
          
          if (error) throw error;
          
          set((state) => ({
            reservations: [...state.reservations, data],
            filteredReservations: [...state.filteredReservations, data],
          }));
          
          // Actualizar disponibilidad
          await get().loadAvailability(data.date);
          
          log.info('✅ Reservation created');
          return data;
          
        } catch (error) {
          log.error('❌ Failed to create reservation:', error);
          throw error;
        }
      },
      
      // === ACTUALIZAR RESERVA ===
      updateReservation: async (reservationId, updates) => {
        try {
          log.info('📝 Updating reservation:', reservationId);
          
          const { data, error } = await supabase
            .from('reservations')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reservationId)
            .select(`
              *,
              customer:customers(*),
              table:tables(*)
            `)
            .single();
          
          if (error) throw error;
          
          set((state) => ({
            reservations: state.reservations.map(res =>
              res.id === reservationId ? data : res
            ),
            filteredReservations: state.filteredReservations.map(res =>
              res.id === reservationId ? data : res
            ),
          }));
          
          log.info('✅ Reservation updated');
          return data;
          
        } catch (error) {
          log.error('❌ Failed to update reservation:', error);
          throw error;
        }
      },
      
      // === CANCELAR RESERVA ===
      cancelReservation: async (reservationId, reason = '') => {
        try {
          log.info('❌ Cancelling reservation:', reservationId);
          
          const { data, error } = await supabase
            .from('reservations')
            .update({
              status: 'cancelled',
              cancellation_reason: reason,
              cancelled_at: new Date().toISOString(),
            })
            .eq('id', reservationId)
            .select()
            .single();
          
          if (error) throw error;
          
          set((state) => ({
            reservations: state.reservations.map(res =>
              res.id === reservationId ? { ...res, status: 'cancelled' } : res
            ),
            filteredReservations: state.filteredReservations.map(res =>
              res.id === reservationId ? { ...res, status: 'cancelled' } : res
            ),
          }));
          
          // Actualizar disponibilidad
          const reservation = get().reservations.find(r => r.id === reservationId);
          if (reservation) {
            await get().loadAvailability(reservation.date);
          }
          
          log.info('✅ Reservation cancelled');
          
        } catch (error) {
          log.error('❌ Failed to cancel reservation:', error);
          throw error;
        }
      },
      
      // === DISPONIBILIDAD ===
      loadAvailability: async (date) => {
        try {
          log.info('⏰ Loading availability for:', date);
          
          const { data, error } = await supabase
            .rpc('get_table_availability', {
              target_date: date,
            });
          
          if (error) throw error;
          
          set((state) => ({
            availability: {
              ...state.availability,
              [date]: data,
            },
          }));
          
          // Generar slots de tiempo disponibles
          get().generateTimeSlots(date);
          
        } catch (error) {
          log.error('❌ Failed to load availability:', error);
        }
      },
      
      generateTimeSlots: (date) => {
        const { settings, availability } = get();
        const dayAvailability = availability[date] || [];
        
        const slots = [];
        const startHour = 12; // 12:00 PM
        const endHour = 23; // 11:00 PM
        
        for (let hour = startHour; hour <= endHour; hour++) {
          for (let minute = 0; minute < 60; minute += settings.slotDuration) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Verificar disponibilidad
            const availableTables = dayAvailability.filter(table => 
              table.available_times.includes(time)
            );
            
            slots.push({
              time,
              available: availableTables.length > 0,
              availableTables: availableTables.length,
              tables: availableTables,
            });
          }
        }
        
        set({ timeSlots: slots });
      },
      
      // === BÚSQUEDA DE MESAS ===
      findAvailableTables: async (date, time, partySize) => {
        try {
          const { data, error } = await supabase
            .rpc('find_available_tables', {
              target_date: date,
              target_time: time,
              party_size: partySize,
            });
          
          if (error) throw error;
          
          return data;
          
        } catch (error) {
          log.error('❌ Failed to find available tables:', error);
          return [];
        }
      },
      
      // === FILTROS ===
      applyFilters: () => {
        const { reservations, filters } = get();
        
        let filtered = [...reservations];
        
        // Filtro por estado
        if (filters.status !== 'all') {
          filtered = filtered.filter(res => res.status === filters.status);
        }
        
        // Filtro por mesa
        if (filters.table !== 'all') {
          filtered = filtered.filter(res => res.table_id === filters.table);
        }
        
        // Filtro por tamaño de grupo
        if (filters.party_size !== 'all') {
          const size = parseInt(filters.party_size);
          filtered = filtered.filter(res => res.party_size === size);
        }
        
        set({ filteredReservations: filtered });
      },
      
      updateFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        
        get().applyFilters();
      },
      
      // === GESTIÓN DE FECHA ===
      setSelectedDate: (date) => {
        set({ selectedDate: date });
        get().loadReservations(date);
      },
      
      // === MÉTRICAS ===
      loadMetrics: async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_reservation_metrics');
          
          if (error) throw error;
          
          set({ metrics: { ...get().metrics, ...data } });
          
        } catch (error) {
          log.error('❌ Failed to load metrics:', error);
        }
      },
      
      // === NOTIFICACIONES Y RECORDATORIOS ===
      sendReminders: async (reservationIds = []) => {
        try {
          log.info('📬 Sending reservation reminders');
          
          const { data, error } = await supabase
            .rpc('send_reservation_reminders', {
              reservation_ids: reservationIds,
            });
          
          if (error) throw error;
          
          log.info('✅ Reminders sent');
          return data;
          
        } catch (error) {
          log.error('❌ Failed to send reminders:', error);
          throw error;
        }
      },
      
      // === VALIDACIONES ===
      validateReservation: (reservationData) => {
        const { settings } = get();
        const errors = [];
        
        // Validar tamaño del grupo
        if (reservationData.party_size > settings.maxPartySize) {
          errors.push(`Máximo ${settings.maxPartySize} personas por reserva`);
        }
        
        // Validar fecha anticipada
        const reservationDate = new Date(reservationData.date);
        const now = new Date();
        const maxDate = new Date(now.getTime() + settings.maxAdvanceBooking * 24 * 60 * 60 * 1000);
        const minDate = new Date(now.getTime() + settings.minAdvanceBooking * 60 * 60 * 1000);
        
        if (reservationDate > maxDate) {
          errors.push(`No se pueden hacer reservas con más de ${settings.maxAdvanceBooking} días de anticipación`);
        }
        
        if (reservationDate < minDate) {
          errors.push(`Las reservas deben hacerse con al menos ${settings.minAdvanceBooking} hora(s) de anticipación`);
        }
        
        return errors;
      },
      
      // === UTILIDADES ===
      getReservationsByStatus: (status) => {
        const { reservations } = get();
        return reservations.filter(res => res.status === status);
      },
      
      getReservationsByTimeRange: (startTime, endTime) => {
        const { filteredReservations } = get();
        return filteredReservations.filter(res => 
          res.time >= startTime && res.time <= endTime
        );
      },
      
      getTodayReservations: () => {
        const today = new Date().toISOString().split('T')[0];
        const { reservations } = get();
        return reservations.filter(res => res.date === today);
      },
      
      // === CONFIGURACIÓN ===
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      // === EXPORTAR ===
      exportReservations: async (format = 'csv', dateRange = {}) => {
        try {
          log.info('📤 Exporting reservations');
          
          const { data, error } = await supabase
            .rpc('export_reservations', {
              export_format: format,
              date_range: dateRange,
            });
          
          if (error) throw error;
          
          // Crear y descargar archivo
          const blob = new Blob([data], { 
            type: format === 'csv' ? 'text/csv' : 'application/json' 
          });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reservations-${new Date().toISOString().split('T')[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          log.info('✅ Reservations exported');
          
        } catch (error) {
          log.error('❌ Failed to export reservations:', error);
          throw error;
        }
      },
      
      // === RESET ===
      reset: () => {
        set({
          reservations: [],
          filteredReservations: [],
          availability: {},
          timeSlots: [],
          selectedDate: new Date().toISOString().split('T')[0],
          filters: {
            status: 'all',
            timeRange: 'today',
            table: 'all',
            party_size: 'all',
          },
          error: null,
        });
      },
    }),
    {
      name: 'ReservationStore',
    }
  )
);
