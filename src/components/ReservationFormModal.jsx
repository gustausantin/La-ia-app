// =========================================
// RESERVATION FORM MODAL WITH VALIDATION
// Modal para crear reservas con validación de disponibilidad
// =========================================

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Phone, Mail, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import ConflictDetectionService from '../services/ConflictDetectionService';
import toast from 'react-hot-toast';

const ReservationFormModal = ({ isOpen, onClose, onSave, tables, restaurantId }) => {
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        reservation_date: format(new Date(), 'yyyy-MM-dd'),
        reservation_time: '20:00',
        party_size: 2,
        table_id: '',
        special_requests: ''
    });
    
    const [availabilityStatus, setAvailabilityStatus] = useState({
        checking: false,
        isValid: null,
        message: '',
        availableSlots: []
    });
    
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                customer_name: '',
                customer_email: '',
                customer_phone: '',
                reservation_date: format(new Date(), 'yyyy-MM-dd'),
                reservation_time: '20:00',
                party_size: 2,
                table_id: '',
                special_requests: '',
                channel: 'manual'
            });
            setAvailabilityStatus({
                checking: false,
                isValid: null,
                message: '',
                availableSlots: []
            });
            setValidationError('');
        }
    }, [isOpen]);

    // Validar disponibilidad cuando cambien fecha, hora, personas o mesa
    useEffect(() => {
        if (formData.reservation_date && formData.reservation_time && formData.party_size) {
            validateAvailability();
        }
    }, [formData.reservation_date, formData.reservation_time, formData.party_size, formData.table_id]);

    const validateAvailability = async () => {
        if (!restaurantId) return;
        
        setAvailabilityStatus(prev => ({ ...prev, checking: true }));
        
        try {
            const validation = await ConflictDetectionService.validateReservationAvailability(
                restaurantId,
                formData.reservation_date,
                formData.reservation_time,
                formData.party_size,
                formData.table_id || null
            );
            
            setAvailabilityStatus({
                checking: false,
                isValid: validation.isValid,
                message: validation.message,
                availableSlots: validation.availableSlots || []
            });
            
        } catch (error) {
            console.error('Error validando disponibilidad:', error);
            setAvailabilityStatus({
                checking: false,
                isValid: false,
                message: 'Error al validar disponibilidad',
                availableSlots: []
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!formData.customer_name.trim()) {
            setValidationError('El nombre del cliente es obligatorio');
            return;
        }
        
        if (!formData.customer_phone.trim()) {
            setValidationError('El teléfono del cliente es obligatorio');
            return;
        }
        
        // Validar disponibilidad final
        if (!availabilityStatus.isValid) {
            setValidationError(availabilityStatus.message || 'No hay disponibilidad para esta reserva');
            return;
        }
        
        setSaving(true);
        setValidationError('');
        
        try {
            // 1. Crear o encontrar cliente
            let customerId;
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('phone', formData.customer_phone)
                .single();
            
            if (existingCustomer) {
                customerId = existingCustomer.id;
                
                // Actualizar datos del cliente si han cambiado
                await supabase
                    .from('customers')
                    .update({
                        name: formData.customer_name,
                        email: formData.customer_email || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', customerId);
            } else {
                // Crear nuevo cliente
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        restaurant_id: restaurantId,
                        name: formData.customer_name,
                        email: formData.customer_email || null,
                        phone: formData.customer_phone,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();
                
                if (customerError) throw customerError;
                customerId = newCustomer.id;
            }
            
            // 2. Seleccionar mesa automáticamente si no se especificó
            let selectedTableId = formData.table_id;
            if (!selectedTableId && availabilityStatus.availableSlots.length > 0) {
                selectedTableId = availabilityStatus.availableSlots[0].table_id;
            }
            
            // 3. Crear la reserva
            const { data: reservation, error: reservationError } = await supabase
                .from('reservations')
                .insert({
                    restaurant_id: restaurantId,
                    customer_id: customerId,
                    customer_name: formData.customer_name,
                    customer_email: formData.customer_email || null,
                    customer_phone: formData.customer_phone,
                    reservation_date: formData.reservation_date,
                    reservation_time: formData.reservation_time,
                    party_size: formData.party_size,
                    table_id: selectedTableId,
                    special_requests: formData.special_requests || null,
                    status: 'confirmada',
                    source: 'dashboard', // ✅ Fuente: creada desde dashboard
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (reservationError) throw reservationError;
            
            // 4. Marcar slot como ocupado si existe
            if (availabilityStatus.availableSlots.length > 0) {
                const slotToBook = availabilityStatus.availableSlots.find(slot => 
                    slot.table_id === selectedTableId
                ) || availabilityStatus.availableSlots[0];
                
                await supabase
                    .from('availability_slots')
                    .update({
                        status: 'reserved',
                        metadata: {
                            reservation_id: reservation.id,
                            customer_name: formData.customer_name,
                            party_size: formData.party_size
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', slotToBook.id);
            }
            
            toast.success('✅ Reserva creada correctamente');
            onSave();
            
        } catch (error) {
            console.error('Error creando reserva:', error);
            setValidationError('Error al crear la reserva: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-base font-bold text-gray-900">
                        📅 Nueva Reserva
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Datos del cliente */}
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Datos del Cliente
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        customer_name: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nombre del cliente"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        customer_phone: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+34 123 456 789"
                                    required
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (opcional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.customer_email}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        customer_email: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="cliente@email.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Datos de la reserva */}
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Detalles de la Reserva
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha *
                                </label>
                                <input
                                    type="date"
                                    value={formData.reservation_date}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        reservation_date: e.target.value
                                    }))}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hora *
                                </label>
                                <input
                                    type="time"
                                    value={formData.reservation_time}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        reservation_time: e.target.value
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Personas *
                                </label>
                                <input
                                    type="number"
                                    value={formData.party_size}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        party_size: parseInt(e.target.value) || 1
                                    }))}
                                    min="1"
                                    max="20"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                        
                        {/* Mesa específica (opcional) */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mesa específica (opcional)
                            </label>
                            <select
                                value={formData.table_id}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    table_id: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Asignación automática</option>
                                {tables.filter(table => table.is_active).map(table => (
                                    <option key={table.id} value={table.id}>
                                        {table.name} - {table.zone} (Cap: {table.capacity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Estado de disponibilidad */}
                    <div className="mb-6">
                        {availabilityStatus.checking && (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                <span className="text-blue-800">Verificando disponibilidad...</span>
                            </div>
                        )}
                        
                        {!availabilityStatus.checking && availabilityStatus.isValid === true && (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-green-800">✅ Disponibilidad confirmada</span>
                            </div>
                        )}
                        
                        {!availabilityStatus.checking && availabilityStatus.isValid === false && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="text-red-800">❌ {availabilityStatus.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Notas especiales */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Peticiones especiales
                        </label>
                        <textarea
                            value={formData.special_requests}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                special_requests: e.target.value
                            }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Alergias, preferencias de mesa, celebraciones..."
                        />
                    </div>

                    {/* Error de validación */}
                    {validationError && (
                        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <span className="text-red-800">{validationError}</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || availabilityStatus.checking || availabilityStatus.isValid === false}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Guardando...' : 'Crear Reserva'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationFormModal;
