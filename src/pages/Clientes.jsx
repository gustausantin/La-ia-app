// Clientes.jsx - CRM con funcionalidad básica
import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import {
    Search, Plus, Users, Mail, Phone, Edit2, X, 
    AlertTriangle, RefreshCw, Settings, Crown,
    Clock, DollarSign, TrendingUp, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

// Segmentación básica
const CUSTOMER_SEGMENTS = {
    nuevo: { label: "Nuevo", icon: "👋", color: "blue" },
    regular: { label: "Regular", icon: "⭐", color: "green" },
    vip: { label: "VIP", icon: "👑", color: "purple" },
    inactivo: { label: "Inactivo", icon: "😴", color: "gray" }
};

// Componente principal
export default function Clientes() {
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [filters, setFilters] = useState({ search: "" });

    // Cargar clientes
    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            
            if (!restaurantId) {
                console.log('📋 Clientes: Sin restaurantId');
                setCustomers([]);
                setLoading(false);
                return;
            }

            const { data: customers, error } = await supabase
                .from("customers")
                .select(`
                    id, restaurant_id, name, email, phone, 
                    total_visits, total_spent, last_visit, created_at,
                    consent_whatsapp, consent_email, notes
                `)
                .eq("restaurant_id", restaurantId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            console.log("✅ Clientes cargados:", customers?.length || 0);
            setCustomers(customers || []);

        } catch (error) {
            console.error("❌ Error cargando clientes:", error);
            toast.error("Error al cargar los clientes");
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Editar cliente
    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setShowCreateModal(true);
    };

    // Filtrar clientes
    const filteredCustomers = customers.filter(customer => {
        if (!filters.search) return true;
        const searchTerm = filters.search.toLowerCase();
        return (
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm) ||
            customer.phone?.includes(searchTerm)
        );
    });

    // Effects
    useEffect(() => {
        if (isReady && restaurantId) {
            loadCustomers();
        }
    }, [isReady, restaurantId, loadCustomers]);

    // Pantallas de carga y error
    if (!isReady) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Cargando información del restaurante...
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    if (!restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Configuración Pendiente
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Para gestionar clientes necesitas completar la configuración de tu restaurante.
                        </p>
                        <button
                            onClick={() => window.location.href = '/configuracion'}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Settings className="w-4 h-4" />
                            Ir a Configuración
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
                        <p className="text-gray-600">Sistema CRM para tu restaurante</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadCustomers}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Cliente
                        </button>
                    </div>
                </div>

                {/* Stats rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Clientes</p>
                                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Nuevos (30d)</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {customers.filter(c => differenceInDays(new Date(), new Date(c.created_at)) <= 30).length}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Gastado</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    €{customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Activos</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {customers.filter(c => c.last_visit && differenceInDays(new Date(), new Date(c.last_visit)) <= 60).length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Lista de clientes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="p-8 text-center">
                            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-600">Cargando clientes...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {customers.length === 0 ? "No hay clientes registrados" : "No se encontraron clientes"}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {customers.length === 0 
                                    ? "Comienza creando tu primer cliente"
                                    : "Prueba con un término de búsqueda diferente"
                                }
                            </p>
                            {customers.length === 0 && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear primer cliente
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => handleEditCustomer(customer)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                                        {customer.name}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        {customer.email && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {customer.email}
                                                            </p>
                                                        )}
                                                        {customer.phone && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {customer.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="text-center">
                                                <p className="font-medium text-gray-900">{customer.total_visits || 0}</p>
                                                <p className="text-xs">Visitas</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-gray-900">€{(customer.total_spent || 0).toFixed(2)}</p>
                                                <p className="text-xs">Gastado</p>
                                            </div>
                                            {customer.last_visit && (
                                                <div className="text-center">
                                                    <p className="font-medium text-gray-900">
                                                        {format(parseISO(customer.last_visit), 'dd/MM')}
                                                    </p>
                                                    <p className="text-xs">Última</p>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCustomer(customer);
                                                }}
                                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de creación/edición */}
            {showCreateModal && (
                <CustomerModal
                    customer={editingCustomer}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingCustomer(null);
                    }}
                    onSubmit={loadCustomers}
                />
            )}
        </div>
    );
}

// Modal de creación/edición de cliente
const CustomerModal = ({ customer, onClose, onSubmit }) => {
    const { restaurantId } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: customer?.name || "",
        email: customer?.email || "",
        phone: customer?.phone || "",
        notes: customer?.notes || "",
        consent_whatsapp: customer?.consent_whatsapp || false,
        consent_email: customer?.consent_email || false,
        preferred_channel: customer?.preferred_channel || 'ninguno'
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.first_name.trim()) newErrors.first_name = "El nombre es obligatorio";
        if (!formData.email.trim()) newErrors.email = "El email es obligatorio";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email inválido";
        if (!formData.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const customerData = {
                restaurant_id: restaurantId,
                name: formData.first_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                notes: formData.notes.trim(),
                consent_whatsapp: formData.consent_whatsapp,
                consent_email: formData.consent_email,
                preferences: {
                    preferred_channel: formData.preferred_channel
                }
            };

            if (customer) {
                const { error } = await supabase
                    .from("customers")
                    .update(customerData)
                    .eq("id", customer.id);
                if (error) throw error;
                toast.success("Cliente actualizado correctamente");
            } else {
                const { error } = await supabase
                    .from("customers")
                    .insert([customerData]);
                if (error) throw error;
                toast.success("Cliente creado correctamente");
            }

            onSubmit();
            onClose();
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            toast.error("Error al guardar el cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {customer ? 'Editar' : 'Nuevo'} Cliente
                        </h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                        <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value}))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.first_name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Ej: María González"
                        />
                        {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="cliente@ejemplo.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="+34 123 456 789"
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* CORREGIDO: Toggle claro para comunicaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Recibir comunicaciones automáticas
                        </label>
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev, 
                                    consent_whatsapp: !prev.consent_whatsapp || !prev.consent_email,
                                    consent_email: !prev.consent_whatsapp || !prev.consent_email
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    formData.consent_whatsapp || formData.consent_email ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.consent_whatsapp || formData.consent_email ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                            <span className="ml-3 text-sm text-gray-700">
                                {formData.consent_whatsapp || formData.consent_email ? 'Activado' : 'Desactivado'}
                            </span>
                        </div>
                    </div>

                    {/* CORREGIDO: Canal preferido único */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Canal Preferido</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'bg-green-50 border-green-200 text-green-700' },
                                { key: 'email', label: 'Email', icon: '📧', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                                { key: 'ninguno', label: 'Ninguno', icon: '🚫', color: 'bg-gray-50 border-gray-200 text-gray-700' }
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev, 
                                            preferred_channel: option.key,
                                            consent_whatsapp: option.key === 'whatsapp',
                                            consent_email: option.key === 'email'
                                        }));
                                    }}
                                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                                        formData.preferred_channel === option.key 
                                            ? option.color + ' border-current' 
                                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="text-lg mb-1">{option.icon}</div>
                                    <div className="text-xs font-medium">{option.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Preferencias, alergias, comentarios..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Guardando..." : customer ? "Actualizar" : "Crear"} Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
