// ======================================================================
// SERVICIO DE VALIDACIÓN DE RESERVAS - ENTERPRISE GRADE
// ======================================================================
// NORMA 2: Solo datos REALES de Supabase
// NORMA 3: Multi-tenant (filtrado por restaurant_id)
// NORMA 4: Usa AvailabilityService y tablas existentes
// ======================================================================

import { supabase } from '../lib/supabase';
import { AvailabilityService } from './AvailabilityService';

/**
 * Servicio de validación de reservas con reglas de negocio completas
 */
export class ReservationValidationService {
  
  /**
   * Validar fecha de reserva
   * @param {string} restaurantId - ID del restaurante
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>} { valid: boolean, message: string, code: string }
   */
  static async validateDate(restaurantId, date) {
    try {
      if (!date) {
        return {
          valid: false,
          message: 'La fecha es obligatoria',
          code: 'DATE_REQUIRED'
        };
      }

      const selectedDate = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. No permitir fechas pasadas
      if (selectedDate < today) {
        return {
          valid: false,
          message: 'No se pueden hacer reservas en fechas pasadas',
          code: 'DATE_PAST'
        };
      }

      // 2. Obtener configuración del restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) {
        console.error('Error obteniendo configuración:', restaurantError);
        return {
          valid: false,
          message: 'Error al validar la fecha',
          code: 'CONFIG_ERROR'
        };
      }

      const settings = restaurant?.settings || {};
      const maxAdvanceDays = settings.max_advance_days || 30;

      // 3. Verificar rango máximo de antelación
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

      if (selectedDate > maxDate) {
        return {
          valid: false,
          message: `No se aceptan reservas con más de ${maxAdvanceDays} días de antelación`,
          code: 'DATE_TOO_FAR'
        };
      }

      // 4. Verificar eventos especiales (cierres, festivos)
      const { data: events, error: eventsError } = await supabase
        .from('special_events')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .lte('event_date', date)
        .gte('event_date', date);

      if (eventsError) {
        console.warn('Error verificando eventos especiales:', eventsError);
      }

      const closedEvent = events?.find(event => 
        event.is_closed === true && event.event_date === date
      );

      if (closedEvent) {
        return {
          valid: false,
          message: `Este día está cerrado: ${closedEvent.title || 'Día especial'}`,
          code: 'DATE_CLOSED',
          event: closedEvent
        };
      }

      return {
        valid: true,
        message: 'Fecha válida',
        code: 'DATE_VALID'
      };

    } catch (error) {
      console.error('Error validando fecha:', error);
      return {
        valid: false,
        message: 'Error al validar la fecha',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Validar hora de reserva
   * @param {string} restaurantId - ID del restaurante
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} time - Hora en formato HH:MM:SS
   * @returns {Promise<Object>} { valid: boolean, message: string, alternatives: array }
   */
  static async validateTime(restaurantId, date, time) {
    try {
      if (!time) {
        return {
          valid: false,
          message: 'La hora es obligatoria',
          code: 'TIME_REQUIRED'
        };
      }

      // 1. Validar usando AvailabilityService
      const validation = await AvailabilityService.validateBookingTime(restaurantId, date, time);

      if (!validation.valid) {
        return {
          valid: false,
          message: validation.reason || 'Horario no disponible',
          code: validation.code || 'TIME_INVALID'
        };
      }

      // 2. Verificar si hay slots disponibles en esa hora
      const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select(`
          id,
          start_time,
          end_time,
          status,
          tables (
            id,
            table_number,
            capacity,
            is_active
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('slot_date', date)
        .lte('start_time', time)
        .gte('end_time', time)
        .eq('status', 'free')
        .eq('tables.is_active', true);

      if (slotsError) {
        console.error('Error verificando slots:', slotsError);
        return {
          valid: false,
          message: 'Error al verificar disponibilidad horaria',
          code: 'SLOTS_ERROR'
        };
      }

      if (!slots || slots.length === 0) {
        // Buscar alternativas cercanas (±30 minutos)
        const alternatives = await this.findAlternativeTimes(restaurantId, date, time, 30);
        
        return {
          valid: false,
          message: 'No hay disponibilidad a esta hora',
          code: 'TIME_NO_AVAILABILITY',
          alternatives: alternatives.length > 0 ? alternatives : []
        };
      }

      return {
        valid: true,
        message: 'Hora válida con disponibilidad',
        code: 'TIME_VALID',
        availableSlots: slots.length
      };

    } catch (error) {
      console.error('Error validando hora:', error);
      return {
        valid: false,
        message: 'Error al validar la hora',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Buscar horas alternativas cercanas
   * @param {string} restaurantId - ID del restaurante
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} requestedTime - Hora solicitada en formato HH:MM:SS
   * @param {number} rangeMinutes - Rango de búsqueda en minutos (±)
   * @returns {Promise<Array>} Array de horas alternativas
   */
  static async findAlternativeTimes(restaurantId, date, requestedTime, rangeMinutes = 60) {
    try {
      const { data: slots, error } = await supabase
        .from('availability_slots')
        .select('start_time, end_time')
        .eq('restaurant_id', restaurantId)
        .eq('slot_date', date)
        .eq('status', 'free')
        .order('start_time');

      if (error || !slots) {
        return [];
      }

      // Filtrar horarios únicos y ordenar
      const uniqueTimes = [...new Set(slots.map(slot => slot.start_time))];
      
      return uniqueTimes.slice(0, 3).map(time => ({
        time,
        label: time.substring(0, 5) // HH:MM
      }));

    } catch (error) {
      console.error('Error buscando alternativas:', error);
      return [];
    }
  }

  /**
   * 🚀 BUSCAR ALTERNATIVAS MÁS CERCANAS (PROFESIONAL)
   * Encuentra los K horarios más cercanos a la hora solicitada
   * @param {string} restaurantId - ID del restaurante
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} requestedTime - Hora solicitada en formato HH:MM o HH:MM:SS
   * @param {number} partySize - Número de personas
   * @param {number} k - Número máximo de alternativas a devolver (default: 6)
   * @returns {Promise<Array>} Array de alternativas ordenadas por proximidad
   * 
   * REGLA 2: Solo datos REALES de availability_slots
   * REGLA 3: Multi-tenant (filtrado por restaurant_id)
   */
  static async findNearestAlternatives(restaurantId, date, requestedTime, partySize, k = 6) {
    try {
      console.log('🔍 Buscando alternativas cercanas:', { restaurantId, date, requestedTime, partySize, k });

      // 1. Obtener TODOS los slots disponibles del día con mesas válidas
      const { data: slots, error } = await supabase
        .from('availability_slots')
        .select(`
          start_time,
          end_time,
          status,
          tables (
            id,
            table_number,
            name,
            capacity,
            is_active
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('slot_date', date)
        .eq('status', 'free')
        .gte('tables.capacity', partySize)
        .eq('tables.is_active', true)
        .order('start_time');

      if (error) {
        console.error('❌ Error obteniendo slots:', error);
        return [];
      }

      if (!slots || slots.length === 0) {
        console.log('⚠️ No hay slots disponibles para este día');
        return [];
      }

      // 2. Agrupar por hora (start_time) y contar mesas disponibles
      const timeGroups = {};
      
      slots.forEach(slot => {
        const timeKey = slot.start_time;
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = {
            time: timeKey,
            availableTables: [],
            tableCount: 0
          };
        }
        
        if (slot.tables) {
          timeGroups[timeKey].availableTables.push(slot.tables);
          timeGroups[timeKey].tableCount++;
        }
      });

      // 3. Convertir a array de alternativas
      const alternatives = Object.values(timeGroups);

      if (alternatives.length === 0) {
        console.log('⚠️ No hay alternativas disponibles');
        return [];
      }

      // 4. Calcular proximidad a la hora solicitada
      // Normalizar requestedTime a formato HH:MM:SS si viene como HH:MM
      const normalizedRequestedTime = requestedTime.length === 5 ? `${requestedTime}:00` : requestedTime;
      const [reqHours, reqMinutes] = normalizedRequestedTime.split(':').map(Number);
      const requestedMinutes = reqHours * 60 + reqMinutes;

      alternatives.forEach(alt => {
        const [altHours, altMinutes] = alt.time.split(':').map(Number);
        const altMinutesTotal = altHours * 60 + altMinutes;
        
        // Diferencia en minutos (valor absoluto)
        alt.proximityMinutes = Math.abs(altMinutesTotal - requestedMinutes);
        
        // Formato bonito para mostrar (HH:MM)
        alt.displayTime = alt.time.substring(0, 5);
      });

      // 5. Ordenar por proximidad (más cercano primero)
      alternatives.sort((a, b) => a.proximityMinutes - b.proximityMinutes);

      // 6. Tomar solo las K más cercanas
      const topAlternatives = alternatives.slice(0, k);

      console.log('✅ Alternativas encontradas:', topAlternatives.map(a => 
        `${a.displayTime} (${a.tableCount} mesas, ${a.proximityMinutes} min)`
      ));

      return topAlternatives.map(alt => ({
        time: alt.time,
        displayTime: alt.displayTime,
        availableTables: alt.tableCount,
        proximityMinutes: alt.proximityMinutes,
        label: `${alt.displayTime} · ${alt.tableCount} mesa${alt.tableCount > 1 ? 's' : ''}`
      }));

    } catch (error) {
      console.error('❌ Error buscando alternativas cercanas:', error);
      return [];
    }
  }

  /**
   * Validar número de personas
   * @param {string} restaurantId - ID del restaurante
   * @param {number} partySize - Número de personas
   * @returns {Promise<Object>} { valid: boolean, message: string }
   */
  static async validatePartySize(restaurantId, partySize) {
    try {
      if (!partySize || partySize < 1) {
        return {
          valid: false,
          message: 'El número de personas debe ser al menos 1',
          code: 'PARTY_SIZE_MIN'
        };
      }

      // Obtener configuración del restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) {
        console.error('Error obteniendo configuración:', restaurantError);
      }

      const settings = restaurant?.settings || {};
      const minPartySize = settings.min_party_size || 1;
      const maxPartySize = settings.max_party_size || 20;
      const largeGroupThreshold = settings.large_group_threshold || 10;

      if (partySize < minPartySize) {
        return {
          valid: false,
          message: `El número mínimo de personas es ${minPartySize}`,
          code: 'PARTY_SIZE_TOO_SMALL'
        };
      }

      if (partySize > maxPartySize) {
        return {
          valid: false,
          message: `Para grupos de más de ${maxPartySize} personas, contacte directamente con el restaurante`,
          code: 'PARTY_SIZE_TOO_LARGE',
          requiresContact: true
        };
      }

      if (partySize >= largeGroupThreshold) {
        return {
          valid: true,
          message: 'Grupo grande detectado',
          code: 'PARTY_SIZE_LARGE_GROUP',
          isLargeGroup: true,
          warning: `Grupos de ${partySize} personas pueden requerir confirmación adicional`
        };
      }

      return {
        valid: true,
        message: 'Número de personas válido',
        code: 'PARTY_SIZE_VALID'
      };

    } catch (error) {
      console.error('Error validando party_size:', error);
      return {
        valid: false,
        message: 'Error al validar el número de personas',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Obtener mesas disponibles filtradas por capacidad y disponibilidad
   * @param {string} restaurantId - ID del restaurante
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} time - Hora en formato HH:MM:SS
   * @param {number} partySize - Número de personas
   * @returns {Promise<Object>} { success: boolean, tables: array }
   */
  static async getAvailableTables(restaurantId, date, time, partySize) {
    try {
      // Obtener slots libres en esa fecha/hora
      const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select(`
          id,
          table_id,
          start_time,
          end_time,
          tables (
            id,
            table_number,
            name,
            capacity,
            zone,
            location,
            is_active
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('slot_date', date)
        .lte('start_time', time)
        .gte('end_time', time)
        .eq('status', 'free')
        .gte('tables.capacity', partySize)
        .eq('tables.is_active', true)
        .order('tables.capacity', { ascending: true }); // Ordenar por capacidad (mesa más pequeña primero)

      if (slotsError) {
        console.error('Error obteniendo mesas disponibles:', slotsError);
        return {
          success: false,
          tables: [],
          message: 'Error al obtener mesas disponibles'
        };
      }

      if (!slots || slots.length === 0) {
        return {
          success: false,
          tables: [],
          message: `No hay mesas disponibles para ${partySize} personas a las ${time.substring(0, 5)}`
        };
      }

      // Eliminar duplicados por table_id
      const uniqueTables = [];
      const seenTableIds = new Set();

      slots.forEach(slot => {
        if (slot.tables && !seenTableIds.has(slot.tables.id)) {
          seenTableIds.add(slot.tables.id);
          uniqueTables.push({
            ...slot.tables,
            slotId: slot.id,
            slotTime: `${slot.start_time} - ${slot.end_time}`
          });
        }
      });

      return {
        success: true,
        tables: uniqueTables,
        message: `${uniqueTables.length} mesa(s) disponible(s)`
      };

    } catch (error) {
      console.error('Error obteniendo mesas disponibles:', error);
      return {
        success: false,
        tables: [],
        message: 'Error al buscar mesas disponibles'
      };
    }
  }

  /**
   * Validar mesa seleccionada
   * @param {string} restaurantId - ID del restaurante
   * @param {string} tableId - ID de la mesa
   * @param {number} partySize - Número de personas
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} time - Hora en formato HH:MM:SS
   * @returns {Promise<Object>} { valid: boolean, message: string }
   */
  static async validateTable(restaurantId, tableId, partySize, date, time) {
    try {
      if (!tableId) {
        return {
          valid: false,
          message: 'Debe seleccionar una mesa',
          code: 'TABLE_REQUIRED'
        };
      }

      // 1. Verificar que la mesa existe y está activa
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .eq('id', tableId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (tableError || !table) {
        return {
          valid: false,
          message: 'Mesa no encontrada',
          code: 'TABLE_NOT_FOUND'
        };
      }

      if (!table.is_active) {
        return {
          valid: false,
          message: 'Esta mesa no está disponible',
          code: 'TABLE_INACTIVE'
        };
      }

      // 2. Verificar capacidad
      if (table.capacity < partySize) {
        return {
          valid: false,
          message: `La mesa ${table.table_number} solo tiene capacidad para ${table.capacity} personas (necesitas ${partySize})`,
          code: 'TABLE_CAPACITY_INSUFFICIENT'
        };
      }

      // 3. Verificar que hay slot libre para esa mesa en fecha/hora
      const { data: slot, error: slotError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId)
        .eq('slot_date', date)
        .lte('start_time', time)
        .gte('end_time', time)
        .eq('status', 'free')
        .maybeSingle();

      if (slotError) {
        console.error('Error verificando slot:', slotError);
        return {
          valid: false,
          message: 'Error al verificar disponibilidad de la mesa',
          code: 'SLOT_CHECK_ERROR'
        };
      }

      if (!slot) {
        return {
          valid: false,
          message: `La mesa ${table.table_number} no está disponible en ese horario`,
          code: 'TABLE_NOT_AVAILABLE'
        };
      }

      return {
        valid: true,
        message: `Mesa ${table.table_number} disponible`,
        code: 'TABLE_VALID',
        table: table
      };

    } catch (error) {
      console.error('Error validando mesa:', error);
      return {
        valid: false,
        message: 'Error al validar la mesa',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Validación completa de reserva (todos los campos)
   * @param {Object} reservationData - Datos de la reserva
   * @returns {Promise<Object>} { valid: boolean, errors: object }
   */
  static async validateFullReservation(reservationData) {
    const { restaurantId, date, time, partySize, tableId, customerPhone, customerName } = reservationData;

    const errors = {};

    // 1. Validar teléfono/cliente
    if (!customerPhone) {
      errors.customerPhone = 'El teléfono es obligatorio';
    }

    if (!customerName) {
      errors.customerName = 'El nombre es obligatorio';
    }

    // 2. Validar fecha
    const dateValidation = await this.validateDate(restaurantId, date);
    if (!dateValidation.valid) {
      errors.date = dateValidation.message;
    }

    // 3. Validar hora
    const timeValidation = await this.validateTime(restaurantId, date, time);
    if (!timeValidation.valid) {
      errors.time = timeValidation.message;
    }

    // 4. Validar personas
    const partySizeValidation = await this.validatePartySize(restaurantId, partySize);
    if (!partySizeValidation.valid) {
      errors.partySize = partySizeValidation.message;
    }

    // 5. Validar mesa
    const tableValidation = await this.validateTable(restaurantId, tableId, partySize, date, time);
    if (!tableValidation.valid) {
      errors.tableId = tableValidation.message;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings: []
    };
  }
}

export default ReservationValidationService;

