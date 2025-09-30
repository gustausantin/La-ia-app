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
      restaurantId: null, // ID del restaurante - REQUERIDO para datos reales
      
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
      
      // === CONFIGURACIÓN DINÁMICA - SOLO DATOS REALES ===
      settings: {
        // NUNCA valores por defecto - SIEMPRE desde Supabase
        slotDuration: null, // se obtiene OBLIGATORIAMENTE de restaurants.settings.reservation_duration
        maxAdvanceBooking: null, // se obtiene OBLIGATORIAMENTE de restaurants.settings.advance_booking_days
        minAdvanceBooking: null, // se obtiene OBLIGATORIAMENTE de restaurants.settings.min_advance_hours
        maxPartySize: null, // se obtiene OBLIGATORIAMENTE de restaurants.settings.max_party_size
        minPartySize: null, // se obtiene OBLIGATORIAMENTE de restaurants.settings.min_party_size
        bufferTime: 15, // único valor técnico permitido
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
      
      // === INICIALIZACIÓN CON DATOS REALES ===
      initialize: async (restaurantId) => {
        try {
          log.info('🚀 Initializing reservation store with REAL data for restaurant:', restaurantId);
          
          if (!restaurantId) {
            throw new Error('Restaurant ID is REQUIRED for initialization');
          }
          
          set({ restaurantId, isLoading: true, error: null });
          
          // Cargar política de reservas REAL
          await get().loadReservationPolicy(restaurantId);
          
          log.info('✅ Reservation store initialized with REAL data');
          
        } catch (error) {
          log.error('❌ Failed to initialize reservation store:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      // === CARGAR POLÍTICA DE RESERVAS - SOLO DATOS REALES ===
      loadReservationPolicy: async (restaurantId) => {
        try {
          log.info('⚙️ Loading REAL reservation policy for restaurant:', restaurantId);
          
          if (!restaurantId) {
            throw new Error('Restaurant ID is required - NO DEFAULTS ALLOWED');
          }
          
          const { data, error } = await supabase
            .from('restaurants')
            .select('settings')
            .eq('id', restaurantId)
            .single();
          
          if (error) throw error;
          
          const policy = data?.settings || {};
          
          // VALIDAR que existan los datos REALES - NO defaults
          if (!policy.reservation_duration || !policy.advance_booking_days || 
              !policy.min_advance_hours || !policy.max_party_size || !policy.min_party_size) {
            throw new Error('INCOMPLETE RESERVATION POLICY - All fields required in restaurants.settings');
          }
          
          // Actualizar SOLO con datos REALES de Supabase
          set((state) => ({
            settings: {
              ...state.settings,
              slotDuration: policy.reservation_duration,
              maxAdvanceBooking: policy.advance_booking_days,
              minAdvanceBooking: policy.min_advance_hours,
              maxPartySize: policy.max_party_size,
              minPartySize: policy.min_party_size,
            }
          }));
          
          log.info('✅ REAL reservation policy loaded:', {
            duration: policy.reservation_duration,
            advanceDays: policy.advance_booking_days,
            minHours: policy.min_advance_hours,
            partySize: `${policy.min_party_size}-${policy.max_party_size}`
          });
          
        } catch (error) {
          log.error('❌ Failed to load REAL reservation policy:', error);
          // NO defaults - la aplicación debe mostrar error si no hay datos reales
          throw error;
        }
      },
      
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
          
          // Generar slots de tiempo disponibles con datos REALES
          // Necesitamos el restaurantId - obtenerlo del contexto o parámetro
          const restaurantId = get().restaurantId; // Agregar al estado si no existe
          if (restaurantId) {
            await get().generateTimeSlots(date, restaurantId);
          } else {
            log.error('❌ Restaurant ID required for generating REAL time slots');
          }
          
        } catch (error) {
          log.error('❌ Failed to load availability:', error);
        }
      },
      
      generateTimeSlots: async (date, restaurantId) => {
        try {
          const { settings } = get();
          
          // VALIDAR que tengamos la política REAL cargada
          if (!settings.slotDuration) {
            throw new Error('POLICY NOT LOADED - Must call loadReservationPolicy first');
          }
          
          log.info('🎯 Generating REAL time slots for:', date, 'with duration:', settings.slotDuration);
          
          // 1. OBTENER HORARIOS Y TURNOS REALES desde Supabase
          const { data: scheduleData, error: scheduleError } = await supabase
            .from('restaurant_schedule')
            .select('*')
            .eq('restaurant_id', restaurantId);
            
          if (scheduleError) throw scheduleError;
          
          // 2. OBTENER CALENDARIO REAL (eventos especiales)
          const { data: eventsData, error: eventsError } = await supabase
            .from('special_events')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('event_date', date);
            
          if (eventsError) throw eventsError;
          
          // 3. DETERMINAR HORARIOS REALES PARA EL DÍA
          const dayOfWeek = new Date(date).toLocaleDateString('en', { weekday: 'lowercase' });
          const daySchedule = scheduleData.find(s => s.day_of_week === dayOfWeek);
          const specialEvent = eventsData?.[0];
          
          // Si hay evento especial cerrado, NO generar slots
          if (specialEvent?.is_closed) {
            log.info('🚫 Day is CLOSED due to special event');
            set(state => ({ timeSlots: [] }));
            return;
          }
          
          // Si no está abierto según horario, NO generar slots
          if (!daySchedule?.is_open) {
            log.info('🚫 Day is CLOSED according to schedule');
            set(state => ({ timeSlots: [] }));
            return;
          }
          
          // 4. USAR TURNOS SI EXISTEN, sino horario general
          const timeRanges = [];
          
          if (daySchedule.slots && daySchedule.slots.length > 0) {
            // PRIORIDAD: TURNOS (shifts)
            log.info('📍 Using SHIFTS from schedule');
            daySchedule.slots.forEach(slot => {
              if (slot.start_time && slot.end_time) {
                timeRanges.push({
                  start: slot.start_time,
                  end: slot.end_time,
                  name: slot.name || 'Turno'
                });
              }
            });
          } else {
            // FALLBACK: Horario general (solo si NO hay turnos)
            log.info('📍 Using GENERAL hours from schedule');
            timeRanges.push({
              start: daySchedule.open_time || '09:00',
              end: daySchedule.close_time || '22:00',
              name: 'Horario General'
            });
          }
          
          // 5. GENERAR SLOTS REALES con duración de política
          const slots = [];
          
          timeRanges.forEach(range => {
            const [startHour, startMin] = range.start.split(':').map(Number);
            const [endHour, endMin] = range.end.split(':').map(Number);
            
            let currentTime = startHour * 60 + startMin; // minutos desde medianoche
            const endTime = endHour * 60 + endMin;
            
            while (currentTime + settings.slotDuration <= endTime) {
              const hour = Math.floor(currentTime / 60);
              const minute = currentTime % 60;
              const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              
              slots.push({
                time: timeString,
                available: true, // Se calculará con disponibilidad real
                range: range.name
              });
              
              currentTime += settings.slotDuration;
            }
          });
          
          log.info('✅ Generated REAL slots:', slots.length, 'slots with', settings.slotDuration, 'min duration');
          
          set(state => ({ timeSlots: slots }));
          
        } catch (error) {
          log.error('❌ Failed to generate REAL time slots:', error);
          // NO generar slots falsos - mostrar error
          set(state => ({ timeSlots: [], error: error.message }));
        }
      },
      
      // FUNCIÓN LEGACY - ELIMINAR después de migración
      generateTimeSlotsLegacy: (date) => {
        const { settings, availability } = get();
        const dayAvailability = availability[date] || [];
        
        const slots = [];
        const startHour = 12; // 12:00 PM
        const endHour = 23; // 11:00 PM
        
        for (let hour = startHour; hour <= endHour; hour++) {
          for (let minute = 0; minute < 60; minute += (settings.slotDuration || 30)) {
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
      
      // === OBTENER ESTADÍSTICAS REALES DE DISPONIBILIDADES ===
      getAvailabilityStats: async (restaurantId) => {
        try {
          log.info('📊 Loading REAL availability stats for restaurant:', restaurantId);
          
          if (!restaurantId) {
            throw new Error('Restaurant ID is REQUIRED for REAL stats');
          }
          
          // Consultar slots REALES desde Supabase
          const { data: slotsData, error: slotsError } = await supabase
            .from('availability_slots')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .gte('slot_date', new Date().toISOString().split('T')[0]); // Solo futuros
            
          if (slotsError) throw slotsError;
          
          // Consultar reservas REALES
          const { data: reservationsData, error: reservationsError } = await supabase
            .from('reservations')
            .select('slot_id, status')
            .eq('restaurant_id', restaurantId)
            .gte('reservation_date', new Date().toISOString().split('T')[0])
            .in('status', ['confirmada', 'sentada']);
            
          if (reservationsError) throw reservationsError;
          
          // Calcular estadísticas REALES
          const totalSlots = slotsData.length;
          const reservedSlotIds = new Set(reservationsData.map(r => r.slot_id).filter(Boolean));
          const occupiedSlots = slotsData.filter(slot => reservedSlotIds.has(slot.id)).length;
          const availableSlots = totalSlots - occupiedSlots;
          
          // Consultar mesas REALES
          const { data: tablesData, error: tablesError } = await supabase
            .from('tables')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true);
            
          if (tablesError) throw tablesError;
          
          const stats = {
            total: totalSlots,
            free: availableSlots,
            occupied: occupiedSlots,
            reserved: occupiedSlots, // Mismo valor por ahora
            tablesCount: tablesData.length
          };
          
          log.info('✅ REAL availability stats loaded:', stats);
          return stats;
          
        } catch (error) {
          log.error('❌ Failed to load REAL availability stats:', error);
          // NO retornar stats falsas
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
          restaurantId: null, // Reset restaurant ID también
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
