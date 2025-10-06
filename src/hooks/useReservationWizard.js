// ======================================================================
// HOOK: useReservationWizard - Manejo de flujo paso a paso
// ======================================================================
// Gestiona el wizard de creación/modificación de reservas con validación
// en tiempo real y sugerencias inteligentes
// ======================================================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ReservationValidationService } from '../services/reservationValidationService';
import { AvailabilityService } from '../services/AvailabilityService';

/**
 * Hook para manejar el wizard de reservas paso a paso
 * @param {string} restaurantId - ID del restaurante
 * @param {Object} initialData - Datos iniciales de la reserva (para edición)
 * @returns {Object} Estado y métodos del wizard
 */
export const useReservationWizard = (restaurantId, initialData = null) => {
  
  // ===== ESTADO DEL WIZARD =====
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerPhone: initialData?.customer_phone || '',
    customerId: initialData?.customer_id || null,
    customerName: initialData?.customer_name || '',
    firstName: initialData?.first_name || initialData?.customer_name?.split(' ')[0] || '',
    lastName1: initialData?.last_name1 || initialData?.customer_name?.split(' ')[1] || '',
    lastName2: initialData?.last_name2 || initialData?.customer_name?.split(' ')[2] || '',
    customerEmail: initialData?.customer_email || '',
    birthdate: initialData?.birthdate || '',
    date: initialData?.reservation_date || '',
    time: initialData?.reservation_time || '',
    partySize: initialData?.party_size || 2,
    tableId: initialData?.table_id || null,
    status: initialData?.status || 'pending',  // 🆕 Estado de la reserva
    specialRequests: initialData?.special_requests || ''
  });

  // ===== ESTADO DE VALIDACIONES =====
  const [validations, setValidations] = useState({
    phone: { valid: initialData ? true : null, message: '' },
    date: { valid: initialData ? true : null, message: '', alternatives: [] },
    time: { valid: initialData ? true : null, message: '', alternatives: [] },
    partySize: { valid: initialData ? true : null, message: '' },
    table: { valid: initialData ? true : null, message: '' }
  });

  // ===== ESTADO DE DATOS DINÁMICOS =====
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  
  // ===== ESTADO PARA ALTERNATIVAS (NUEVO) =====
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);

  // ===== PASOS DEL WIZARD =====
  const STEPS = [
    { id: 1, name: 'Cliente', field: 'customerPhone', icon: '📱' },
    { id: 2, name: 'Fecha', field: 'date', icon: '📅' },
    { id: 3, name: 'Hora', field: 'time', icon: '🕐' },
    { id: 4, name: 'Personas', field: 'partySize', icon: '👥' },
    { id: 5, name: 'Mesa', field: 'tableId', icon: '🪑' }
  ];

  // ===== PASO 1: BUSCAR CLIENTE POR TELÉFONO (FLEXIBLE: con o sin +34) =====
  const searchCustomerByPhone = useCallback(async (phone) => {
    if (!phone || phone.length < 9) {
      setExistingCustomer(null);
      return;
    }

    try {
      // 🔥 NORMALIZAR TELÉFONO: Buscar con y sin +34
      const phoneVariants = [];
      
      // Si tiene +34, también buscar sin él
      if (phone.startsWith('+34')) {
        phoneVariants.push(phone); // +34XXXXXXXXX
        phoneVariants.push(phone.substring(3)); // XXXXXXXXX (sin +34)
      } 
      // Si NO tiene +34, también buscar con él
      else {
        phoneVariants.push(phone); // XXXXXXXXX
        phoneVariants.push(`+34${phone}`); // +34XXXXXXXXX
      }

      console.log('🔍 Buscando cliente con variantes:', phoneVariants);

      // Buscar con cualquiera de las variantes
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('phone', phoneVariants)
        .maybeSingle();

      if (error) {
        console.error('Error buscando cliente:', error);
        return;
      }

      if (data) {
        console.log('✅ Cliente encontrado:', data.name);
        setExistingCustomer(data);
        setFormData(prev => ({
          ...prev,
          customerId: data.id,
          customerName: data.name || '',
          firstName: data.first_name || data.name?.split(' ')[0] || '',
          lastName1: data.last_name1 || data.name?.split(' ')[1] || '',
          lastName2: data.last_name2 || data.name?.split(' ')[2] || '',
          customerEmail: data.email || '',
          birthdate: data.birthdate || ''
        }));
      } else {
        console.log('⚠️ Cliente no encontrado');
        setExistingCustomer(null);
        setFormData(prev => ({
          ...prev,
          customerId: null
        }));
      }
    } catch (error) {
      console.error('Error buscando cliente:', error);
    }
  }, [restaurantId]);

  // ===== PASO 2: VALIDAR FECHA =====
  const validateDate = useCallback(async (date) => {
    if (!date) {
      setValidations(prev => ({
        ...prev,
        date: { valid: null, message: '' }
      }));
      return;
    }

    setIsLoading(true);
    const result = await ReservationValidationService.validateDate(restaurantId, date);
    
    setValidations(prev => ({
      ...prev,
      date: {
        valid: result.valid,
        message: result.message,
        code: result.code
      }
    }));
    
    setIsLoading(false);
    return result;
  }, [restaurantId]);

  // ===== PASO 3: VALIDAR HORA =====
  const validateTime = useCallback(async (date, time) => {
    if (!date || !time) {
      setValidations(prev => ({
        ...prev,
        time: { valid: null, message: '', alternatives: [] }
      }));
      setSuggestedTimes([]);
      return;
    }

    setIsLoading(true);
    // 🔥 Pasar el ID de la reserva actual si estamos editando
    const excludeId = initialData?.id || null;
    const result = await ReservationValidationService.validateTime(restaurantId, date, time, excludeId);
    
    // ❌ NO buscar alternativas en Paso 3 (aún no sabemos partySize)
    // ✅ Las alternativas se buscan SOLO en Paso 5 cuando ya tenemos todos los datos
    setValidations(prev => ({
      ...prev,
      time: result
    }));
    
    setIsLoading(false);
    return result;
  }, [restaurantId, formData.partySize]);

  // ===== PASO 4: VALIDAR PERSONAS =====
  const validatePartySize = useCallback(async (partySize) => {
    if (!partySize || partySize < 1) {
      setValidations(prev => ({
        ...prev,
        partySize: { valid: null, message: '' }
      }));
      return;
    }

    setIsLoading(true);
    const result = await ReservationValidationService.validatePartySize(restaurantId, partySize);
    
    setValidations(prev => ({
      ...prev,
      partySize: {
        valid: result.valid,
        message: result.message,
        warning: result.warning,
        code: result.code
      }
    }));
    
    setIsLoading(false);
    return result;
  }, [restaurantId]);

  // ===== PASO 5: CARGAR MESAS DISPONIBLES =====
  const loadAvailableTables = useCallback(async (date, time, partySize) => {
    if (!date || !time || !partySize) {
      setAvailableTables([]);
      return;
    }

    setLoadingTables(true);
    const result = await ReservationValidationService.getAvailableTables(
      restaurantId,
      date,
      time,
      partySize
    );
    
    setAvailableTables(result.tables || []);
    setLoadingTables(false);
    
    return result;
  }, [restaurantId]);

  // ===== VALIDAR MESA SELECCIONADA =====
  const validateTable = useCallback(async (tableId, partySize, date, time) => {
    if (!tableId) {
      setValidations(prev => ({
        ...prev,
        table: { valid: null, message: '' }
      }));
      return;
    }

    setIsLoading(true);
    const result = await ReservationValidationService.validateTable(
      restaurantId,
      tableId,
      partySize,
      date,
      time
    );
    
    setValidations(prev => ({
      ...prev,
      table: {
        valid: result.valid,
        message: result.message,
        code: result.code
      }
    }));
    
    setIsLoading(false);
    return result;
  }, [restaurantId]);

  // ===== MANEJAR CAMBIO DE CAMPO =====
  const handleFieldChange = useCallback(async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validaciones en tiempo real según el campo
    switch (field) {
      case 'customerPhone':
        if (value.length >= 9) {
          await searchCustomerByPhone(value);
        }
        break;

      case 'date':
        await validateDate(value);
        // Reset campos dependientes
        setValidations(prev => ({
          ...prev,
          time: { valid: null, message: '', alternatives: [] },
          table: { valid: null, message: '' }
        }));
        setAvailableTables([]);
        break;

      case 'time':
        if (formData.date) {
          await validateTime(formData.date, value);
          
          // 🔥 Si estamos editando Y ya hay mesa seleccionada → Re-validarla
          if (initialData && formData.tableId && formData.partySize) {
            console.log('🔄 Re-validando mesa después de cambiar hora...');
            const excludeId = initialData?.id || null;
            const tableResult = await ReservationValidationService.validateTable(
              restaurantId,
              formData.tableId,
              formData.partySize,
              formData.date,
              value, // Nueva hora
              excludeId
            );
            setValidations(prev => ({
              ...prev,
              table: { valid: tableResult.valid, message: tableResult.message }
            }));
          } else {
            // Reset mesa solo si NO estamos editando
            setValidations(prev => ({
              ...prev,
              table: { valid: null, message: '' }
            }));
            setAvailableTables([]);
          }
        }
        break;

      case 'partySize':
        await validatePartySize(value);
        // Reset mesa
        setValidations(prev => ({
          ...prev,
          table: { valid: null, message: '' }
        }));
        setAvailableTables([]);
        break;

      case 'tableId':
        if (formData.date && formData.time && formData.partySize) {
          console.log('🔍 Validando mesa:', { tableId: value, partySize: formData.partySize, date: formData.date, time: formData.time });
          await validateTable(value, formData.partySize, formData.date, formData.time);
        } else {
          console.warn('⚠️ No se puede validar mesa: faltan datos', { 
            date: formData.date, 
            time: formData.time, 
            partySize: formData.partySize 
          });
        }
        break;

      default:
        break;
    }
  }, [formData.date, formData.time, formData.partySize, searchCustomerByPhone, validateDate, validateTime, validatePartySize, validateTable]);

  // ===== NAVEGACIÓN DEL WIZARD =====
  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, STEPS.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  }, [STEPS.length]);

  // ===== VERIFICAR SI PASO ACTUAL ESTÁ COMPLETO =====
  const isCurrentStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: // Cliente
        return formData.customerPhone && formData.firstName && formData.lastName1;
      case 2: // Fecha
        return validations.date.valid === true;
      case 3: // Hora
        return validations.time.valid === true;
      case 4: // Personas
        return formData.partySize >= 1 && validations.partySize.valid !== false;
      case 5: // Mesa
        return validations.table.valid === true;
      default:
        return false;
    }
  }, [currentStep, formData, validations]);

  // ===== CARGAR MESAS AL LLEGAR AL PASO 5 =====
  useEffect(() => {
    if (currentStep === 5 && formData.date && formData.time && formData.partySize) {
      loadAvailableTables(formData.date, formData.time, formData.partySize);
    }
  }, [currentStep, formData.date, formData.time, formData.partySize, loadAvailableTables]);

  // ===== BUSCAR ALTERNATIVAS SI NO HAY MESAS EN PASO 5 =====
  useEffect(() => {
    const searchAlternativesIfNeeded = async () => {
      // Solo buscar si:
      // 1. Estamos en paso 5
      // 2. No hay mesas disponibles
      // 3. NO estamos cargando
      // 4. Tenemos todos los datos necesarios
      // 5. AÚN NO hemos buscado alternativas (para evitar bucles)
      if (
        currentStep === 5 && 
        availableTables.length === 0 && 
        !loadingTables &&
        formData.date && 
        formData.time && 
        formData.partySize &&
        suggestedTimes.length === 0 // 🔥 Solo buscar si NO hay alternativas ya
      ) {
        console.log('🔍 No hay mesas en Paso 5, buscando alternativas...');
        try {
          const excludeId = initialData?.id || null;
          const alternatives = await ReservationValidationService.findNearestAlternatives(
            restaurantId,
            formData.date,
            formData.time,
            formData.partySize,
            6,
            excludeId
          );
          console.log('✅ Alternativas encontradas:', alternatives.length);
          setSuggestedTimes(alternatives);
        } catch (error) {
          console.error('❌ Error buscando alternativas:', error);
          setSuggestedTimes([]); // Evitar bucles en caso de error
        }
      }
    };

    searchAlternativesIfNeeded();
  }, [currentStep, availableTables.length, loadingTables, formData.date, formData.time, formData.partySize, suggestedTimes.length, restaurantId, initialData]);

  // ===== RE-VALIDAR EN MODO EDICIÓN CUANDO CAMBIAN LOS CAMPOS =====
  useEffect(() => {
    if (!initialData) return; // Solo en modo edición

    // Re-validar fecha si cambió
    if (formData.date && formData.date !== initialData.reservation_date) {
      validateDate(formData.date);
    }

    // Re-validar hora si cambió
    if (formData.time && formData.time !== initialData.reservation_time && formData.date) {
      validateTime(formData.date, formData.time);
    }

    // Re-validar personas si cambió
    if (formData.partySize && formData.partySize !== initialData.party_size) {
      validatePartySize(formData.partySize);
    }

    // Re-validar mesa si cambió
    if (formData.tableId && formData.tableId !== initialData.table_id && formData.date && formData.time && formData.partySize) {
      validateTable(formData.tableId, formData.partySize, formData.date, formData.time);
    }
  }, [formData.date, formData.time, formData.partySize, formData.tableId, initialData, validateDate, validateTime, validatePartySize, validateTable]);

  // ===== MANEJO DE ALTERNATIVAS (NUEVO) =====
  const handleSelectAlternative = useCallback(async (alternative) => {
    console.log('✅ Alternativa seleccionada:', alternative);
    
    // 🔥 Limpiar sugerencias PRIMERO para evitar bucles
    setSuggestedTimes([]);
    
    // Cerrar modal
    setShowAlternativesModal(false);
    
    // Actualizar la hora con la alternativa seleccionada
    setFormData(prev => ({
      ...prev,
      time: alternative.time
    }));
    
    // 🔥 NO VALIDAR DE NUEVO - La alternativa YA está validada
    // Marcar validaciones como válidas
    setValidations(prev => ({
      ...prev,
      time: {
        valid: true,
        message: `Hora ${alternative.displayTime} disponible`,
        code: 'TIME_AVAILABLE'
      }
    }));
    
    // 🔥 Cargar mesas disponibles para la nueva hora DIRECTAMENTE
    await loadAvailableTables(formData.date, alternative.time, formData.partySize);
    
    // Mantener en paso 5 para que vea las mesas disponibles
    setCurrentStep(5);
  }, [formData.date, formData.partySize, loadAvailableTables]);

  const openAlternativesModal = useCallback(() => {
    setShowAlternativesModal(true);
  }, []);

  const closeAlternativesModal = useCallback(() => {
    setShowAlternativesModal(false);
  }, []);

  // ===== RESET WIZARD =====
  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setFormData({
      customerPhone: '',
      customerId: null,
      customerName: '',
      firstName: '',
      lastName1: '',
      lastName2: '',
      customerEmail: '',
      birthdate: '',
      date: '',
      time: '',
      partySize: 2,
      tableId: null,
      specialRequests: ''
    });
    setValidations({
      phone: { valid: null, message: '' },
      date: { valid: null, message: '', alternatives: [] },
      time: { valid: null, message: '', alternatives: [] },
      partySize: { valid: null, message: '' },
      table: { valid: null, message: '' }
    });
    setExistingCustomer(null);
    setAvailableTables([]);
    setSuggestedTimes([]);
    setShowAlternativesModal(false);
  }, []);

  return {
    // Estado
    currentStep,
    formData,
    validations,
    existingCustomer,
    availableTables,
    isLoading,
    loadingTables,
    STEPS,
    
    // Estado de alternativas (NUEVO)
    suggestedTimes,
    showAlternativesModal,
    
    // Métodos de validación
    validateDate,
    validateTime,
    validatePartySize,
    validateTable,
    loadAvailableTables,
    searchCustomerByPhone,
    
    // Métodos de navegación
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isCurrentStepValid,
    
    // Métodos de cambio
    handleFieldChange,
    setFormData,
    
    // Métodos de alternativas (NUEVO)
    handleSelectAlternative,
    openAlternativesModal,
    closeAlternativesModal,
    
    // Reset
    resetWizard
  };
};

export default useReservationWizard;

