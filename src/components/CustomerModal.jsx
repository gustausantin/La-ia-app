// CustomerModal.jsx - Ficha de Cliente Unificada WORLD-CLASS
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    X, Save, Mail, Phone, Calendar, DollarSign, TrendingUp,
    Crown, AlertTriangle, CheckCircle2, Clock, Edit2, User,
    MapPin, Heart, Award, Target, Zap, MessageSquare, Shield,
    Eye, EyeOff, Tag, FileText, Settings, Sparkles, Brain,
    Activity, BarChart3, Percent, Users, Gift
} from "lucide-react";
import toast from "react-hot-toast";

// SEGMENTACIÓN INTELIGENTE - WORLD CLASS
const CUSTOMER_SEGMENTS = {
    nuevo: { 
        label: "Nuevo", 
        icon: "👋", 
        color: "blue",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800"
    },
    activo: { 
        label: "Activo", 
        icon: "⭐", 
        color: "green",
        bgColor: "bg-green-50",
        borderColor: "border-green-200", 
        textColor: "text-green-800"
    },
    bib: { 
        label: "BIB", 
        icon: "👑", 
        color: "purple",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-800"
    },
    inactivo: { 
        label: "Inactivo", 
        icon: "😴", 
        color: "gray",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-800"
    },
    riesgo: { 
        label: "En Riesgo", 
        icon: "⚠️", 
        color: "orange",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        textColor: "text-orange-800"
    }
};

// FUNCIÓN PARA DETERMINAR SEGMENTO AUTOMÁTICO
const determineCustomerSegment = (customer, crmConfig = {}) => {
    if (!customer) return 'nuevo';
    
    // Usar configuración dinámica o valores por defecto
    const config = {
        days_new_customer: crmConfig.days_new_customer || 7,
        days_active_customer: crmConfig.days_active_customer || 30,
        days_inactive_customer: crmConfig.days_inactive_customer || 60,
        visits_bib_customer: crmConfig.visits_bib_customer || 10,
        days_risk_customer: crmConfig.days_risk_customer || 45
    };

    const visitsCount = customer.visits_count || customer.total_visits || 0;
    const lastVisitDate = customer.last_visit_at || customer.last_visit;
    
    let daysSinceLastVisit = null;
    if (lastVisitDate) {
        try {
            const lastVisit = typeof lastVisitDate === 'string' ? parseISO(lastVisitDate) : lastVisitDate;
            daysSinceLastVisit = differenceInDays(new Date(), lastVisit);
        } catch (error) {
            console.warn('Error parsing last visit date:', error);
        }
    }

    // Lógica de segmentación inteligente
    if (visitsCount >= config.visits_bib_customer) {
        return 'bib';
    }
    
    if (daysSinceLastVisit === null || visitsCount === 0) {
        return 'nuevo';
    }
    
    if (daysSinceLastVisit <= config.days_active_customer) {
        return 'activo';
    }
    
    if (daysSinceLastVisit <= config.days_risk_customer) {
        return 'riesgo';
    }
    
    return 'inactivo';
};

const CustomerModal = ({ 
    customer, 
    isOpen, 
    onClose, 
    onSave, 
    restaurantId,
    mode = 'view' // 'view', 'edit', 'create'
}) => {
    const [formData, setFormData] = useState({
        // Campos básicos
        name: '',
        first_name: '',
        last_name1: '',
        last_name2: '',
        email: '',
        phone: '',
        
        // Estadísticas (solo lectura)
        visits_count: 0,
        total_spent: 0,
        avg_ticket: 0,
        last_visit_at: null,
        
        // IA Predictiva (solo lectura)
        churn_risk_score: 0,
        predicted_ltv: 0,
        preferred_items: [],
        
        // Consent Management
        consent_email: true,
        consent_sms: true,
        consent_whatsapp: false,
        
        // Otros campos
        preferences: {},
        tags: [],
        notes: '',
        segment_manual: '',
        segment_auto: 'nuevo'
    });
    
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
    const [crmConfig, setCrmConfig] = useState({});

    // Cargar configuración CRM para segmentación
    useEffect(() => {
        const loadCrmConfig = async () => {
            if (!restaurantId) return;
            
            try {
                const { data, error } = await supabase
                    .from('crm_settings')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .single();
                    
                if (data && !error) {
                    setCrmConfig(data);
                }
            } catch (error) {
                console.error('Error loading CRM config:', error);
            }
        };
        
        loadCrmConfig();
    }, [restaurantId]);

    // Inicializar datos del cliente
    useEffect(() => {
        if (customer && isOpen) {
            setFormData({
                name: customer.name || '',
                first_name: customer.first_name || '',
                last_name1: customer.last_name1 || '',
                last_name2: customer.last_name2 || '',
                email: customer.email || '',
                phone: customer.phone || '',
                visits_count: customer.visits_count || customer.total_visits || 0,
                total_spent: customer.total_spent || 0,
                avg_ticket: customer.avg_ticket || 0,
                last_visit_at: customer.last_visit_at || customer.last_visit,
                churn_risk_score: customer.churn_risk_score || 0,
                predicted_ltv: customer.predicted_ltv || 0,
                preferred_items: customer.preferred_items || [],
                consent_email: customer.consent_email !== false,
                consent_sms: customer.consent_sms !== false,
                consent_whatsapp: customer.consent_whatsapp || false,
                preferences: customer.preferences || {},
                tags: customer.tags || [],
                notes: customer.notes || '',
                segment_manual: customer.segment_manual || '',
                segment_auto: customer.segment_auto || 'nuevo'
            });
        } else if (mode === 'create' && isOpen) {
            // Resetear formulario para nuevo cliente
            setFormData({
                name: '',
                first_name: '',
                last_name1: '',
                last_name2: '',
                email: '',
                phone: '',
                visits_count: 0,
                total_spent: 0,
                avg_ticket: 0,
                last_visit_at: null,
                churn_risk_score: 0,
                predicted_ltv: 0,
                preferred_items: [],
                consent_email: true,
                consent_sms: true,
                consent_whatsapp: false,
                preferences: {},
                tags: [],
                notes: '',
                segment_manual: '',
                segment_auto: 'nuevo'
            });
        }
    }, [customer, isOpen, mode]);

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Debug inicial
            console.log('=== INICIANDO GUARDADO ===');
            console.log('Mode:', mode);
            console.log('Customer:', customer);
            console.log('Restaurant ID:', restaurantId);
            console.log('Form Data:', formData);
            
            // Validaciones básicas
            if (!formData.first_name?.trim()) {
                toast.error('❌ El nombre es obligatorio');
                setSaving(false);
                return;
            }
            
            // Validar email si se proporciona
            if (formData.email?.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email.trim())) {
                    toast.error('❌ El email no tiene un formato válido');
                    setSaving(false);
                    return;
                }
            }
            
            if (!restaurantId) {
                toast.error('❌ Error: No se encontró el ID del restaurante');
                setSaving(false);
                return;
            }
            
            // Generar nombre completo automáticamente
            const fullName = `${formData.first_name} ${formData.last_name1 || ''} ${formData.last_name2 || ''}`.trim();
            
            // Preparar datos BÁSICOS para guardar - SIN CAMPOS PROBLEMÁTICOS
            const dataToSave = {
                restaurant_id: restaurantId,
                name: fullName,
                first_name: formData.first_name.trim(),
                consent_email: Boolean(formData.consent_email),
                consent_sms: Boolean(formData.consent_sms),
                consent_whatsapp: Boolean(formData.consent_whatsapp),
                updated_at: new Date().toISOString()
            };

            // Agregar campos opcionales SOLO si tienen valor
            if (formData.last_name1?.trim()) {
                dataToSave.last_name1 = formData.last_name1.trim();
            }
            if (formData.last_name2?.trim()) {
                dataToSave.last_name2 = formData.last_name2.trim();
            }
            if (formData.email?.trim()) {
                dataToSave.email = formData.email.trim();
            }
            if (formData.phone?.trim()) {
                dataToSave.phone = formData.phone.trim();
            }
            if (formData.notes?.trim()) {
                dataToSave.notes = formData.notes.trim();
            }
            // TEMPORALMENTE REMOVIDO segment_manual - CAUSA CONSTRAINT ERROR
            // if (formData.segment_manual?.trim()) {
            //     dataToSave.segment_manual = formData.segment_manual.trim();
            // }
            
            console.log('=== DATOS PREPARADOS ===');
            console.log('Data to save:', dataToSave);

            let result;
            if (mode === 'create') {
                // Crear nuevo cliente
                const { data, error } = await supabase
                    .from('customers')
                    .insert([dataToSave])
                    .select()
                    .single();
                    
                if (error) throw error;
                result = data;
                toast.success('✅ Cliente creado correctamente');
            } else {
                // Actualizar cliente existente
                if (!customer?.id) {
                    throw new Error('ID del cliente no encontrado. No se puede actualizar.');
                }
                
                console.log('Actualizando cliente con ID:', customer.id);
                console.log('Datos a guardar:', dataToSave);
                
                const { data, error } = await supabase
                    .from('customers')
                    .update(dataToSave)
                    .eq('id', customer.id)
                    .select()
                    .single();
                    
                if (error) throw error;
                result = data;
                toast.success('✅ Cliente actualizado correctamente');
            }

            // Llamar callback de guardado
            if (onSave) {
                onSave(result);
            }
            
            setIsEditing(false);
            onClose();
            
        } catch (error) {
            console.error('Error saving customer:', error);
            
            // Mostrar error más específico
            if (error.message) {
                toast.error(`❌ Error: ${error.message}`);
            } else if (error.details) {
                toast.error(`❌ Error: ${error.details}`);
            } else {
                toast.error('❌ Error al guardar cliente. Revisa los datos e intenta de nuevo.');
            }
            
            // Log completo para debugging
            console.log('Data being saved:', dataToSave);
            console.log('Customer ID:', customer?.id);
            console.log('Restaurant ID:', restaurantId);
            console.log('Mode:', mode);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Determinar segmento actual
    const currentSegment = customer ? determineCustomerSegment(customer, crmConfig) : 'nuevo';
    const segmentInfo = CUSTOMER_SEGMENTS[currentSegment] || CUSTOMER_SEGMENTS.nuevo;

    // Calcular días desde última visita
    let daysSinceLastVisit = null;
    if (formData.last_visit_at) {
        try {
            const lastVisit = typeof formData.last_visit_at === 'string' 
                ? parseISO(formData.last_visit_at) 
                : formData.last_visit_at;
            daysSinceLastVisit = differenceInDays(new Date(), lastVisit);
        } catch (error) {
            console.warn('Error calculating days since last visit:', error);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${segmentInfo.bgColor} ${segmentInfo.borderColor} border`}>
                            <span className="text-2xl">{segmentInfo.icon}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {mode === 'create' ? 'Nuevo Cliente' : formData.name || 'Cliente'}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${segmentInfo.bgColor} ${segmentInfo.textColor} ${segmentInfo.borderColor} border`}>
                                    {segmentInfo.label}
                                </span>
                                {customer && (
                                    <span className="text-sm text-gray-500">
                                        Cliente desde {format(parseISO(customer.created_at), 'MMM yyyy', { locale: es })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && mode !== 'create' && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                Editar
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'general', label: 'General', icon: <User className="w-4 h-4" /> },
                            { id: 'stats', label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
                            { id: 'preferences', label: 'Preferencias', icon: <Settings className="w-4 h-4" /> },
                            { id: 'consent', label: 'Permisos', icon: <Shield className="w-4 h-4" /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Tab: General */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información Personal */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <User className="w-5 h-5 text-purple-600" />
                                        Información Personal
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e) => {
                                                    const firstName = e.target.value;
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        first_name: firstName,
                                                        // Actualizar nombre completo automáticamente
                                                        name: `${firstName} ${prev.last_name1 || ''} ${prev.last_name2 || ''}`.trim()
                                                    }));
                                                }}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                                                placeholder="Juan"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Primer apellido
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.last_name1}
                                                    onChange={(e) => {
                                                        const lastName1 = e.target.value;
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            last_name1: lastName1,
                                                            // Actualizar nombre completo automáticamente
                                                            name: `${prev.first_name || ''} ${lastName1} ${prev.last_name2 || ''}`.trim()
                                                        }));
                                                    }}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                                                    placeholder="Pérez"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Segundo apellido
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.last_name2}
                                                    onChange={(e) => {
                                                        const lastName2 = e.target.value;
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            last_name2: lastName2,
                                                            // Actualizar nombre completo automáticamente
                                                            name: `${prev.first_name || ''} ${prev.last_name1 || ''} ${lastName2}`.trim()
                                                        }));
                                                    }}
                                                    disabled={!isEditing}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                                                    placeholder="García"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Información de Contacto */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                        Información de Contacto
                                    </h3>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                                            placeholder="juan@email.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            disabled={!isEditing}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                                            placeholder="+34 600 000 000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notas
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            disabled={!isEditing}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                                            placeholder="Notas adicionales sobre el cliente..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Estadísticas */}
                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Total Visitas</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">{formData.visits_count}</p>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">Total Gastado</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-900">{formData.total_spent}€</p>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-purple-600" />
                                        <span className="text-sm font-medium text-purple-800">Ticket Promedio</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-900">{formData.avg_ticket}€</p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-800">Riesgo Pérdida</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-900">{formData.churn_risk_score}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-gray-600" />
                                        Última Actividad
                                    </h4>
                                    {formData.last_visit_at ? (
                                        <div>
                                            <p className="text-sm text-gray-600">Última visita:</p>
                                            <p className="font-medium">
                                                {format(parseISO(formData.last_visit_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                            </p>
                                            {daysSinceLastVisit !== null && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Hace {daysSinceLastVisit} días
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Sin visitas registradas</p>
                                    )}
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-purple-600" />
                                        IA Predictiva
                                    </h4>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm text-gray-600">Valor de Vida Predicho:</p>
                                            <p className="font-medium">{formData.predicted_ltv}€</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Items Preferidos:</p>
                                            <p className="text-sm text-gray-500">
                                                {formData.preferred_items.length > 0 
                                                    ? formData.preferred_items.join(', ')
                                                    : 'Analizando preferencias...'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Preferencias */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                    Preferencias del Cliente
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-center">
                                        Las preferencias se actualizarán automáticamente basándose en el historial de pedidos y comportamiento del cliente.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-blue-600" />
                                    Etiquetas
                                </h3>
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Agregar etiqueta (presiona Enter)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                    const newTag = e.target.value.trim();
                                                    if (!formData.tags.includes(newTag)) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            tags: [...prev.tags, newTag]
                                                        }));
                                                    }
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                tags: prev.tags.filter((_, i) => i !== index)
                                                            }));
                                                        }}
                                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            {formData.tags.length === 0 && (
                                                <span className="text-gray-500 text-sm">Agrega etiquetas para organizar mejor a tus clientes</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.length > 0 ? (
                                            formData.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-sm">Sin etiquetas asignadas</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Permisos */}
                    {activeTab === 'consent' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    Gestión de Consentimientos (GDPR)
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comunicación por Email</h4>
                                                <p className="text-sm text-gray-600">Autorización para enviar emails promocionales y informativos</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.consent_email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, consent_email: e.target.checked }))}
                                                disabled={!isEditing}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                            />
                                            <span className="text-sm font-medium">
                                                {formData.consent_email ? 'Autorizado' : 'No autorizado'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="w-5 h-5 text-green-600" />
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comunicación por SMS</h4>
                                                <p className="text-sm text-gray-600">Autorización para enviar mensajes SMS</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.consent_sms}
                                                onChange={(e) => setFormData(prev => ({ ...prev, consent_sms: e.target.checked }))}
                                                disabled={!isEditing}
                                                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                                            />
                                            <span className="text-sm font-medium">
                                                {formData.consent_sms ? 'Autorizado' : 'No autorizado'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comunicación por WhatsApp</h4>
                                                <p className="text-sm text-gray-600">Autorización para enviar mensajes por WhatsApp</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.consent_whatsapp}
                                                onChange={(e) => setFormData(prev => ({ ...prev, consent_whatsapp: e.target.checked }))}
                                                disabled={!isEditing}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded disabled:opacity-50"
                                            />
                                            <span className="text-sm font-medium">
                                                {formData.consent_whatsapp ? 'Autorizado' : 'No autorizado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(isEditing || mode === 'create') && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => {
                                if (mode === 'create') {
                                    onClose();
                                } else {
                                    setIsEditing(false);
                                }
                            }}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !formData.first_name?.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerModal;
