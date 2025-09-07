// Clientes.jsx - CRM con funcionalidad básica
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import {
    Search, Plus, Users, Mail, Phone, Edit2, X, 
    AlertTriangle, RefreshCw, Settings, Crown,
    Clock, DollarSign, TrendingUp, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import CustomerModal from "../components/CustomerModal";

// Segmentación básica
const CUSTOMER_SEGMENTS = {
    nuevo: { label: "Nuevo", icon: "👋", color: "blue" },
    regular: { label: "Regular", icon: "⭐", color: "green" },
    vip: { label: "VIP", icon: "👑", color: "purple" },
    inactivo: { label: "Inactivo", icon: "😴", color: "gray" }
};

// Componente principal
export default function Clientes() {
    const navigate = useNavigate();
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'
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
                    id, restaurant_id, name, email, phone, first_name, last_name1, last_name2,
                    segment_auto, segment_manual, visits_count, last_visit_at, total_spent, avg_ticket,
                    churn_risk_score, predicted_ltv, consent_email, consent_sms, consent_whatsapp,
                    preferences, tags, notes, created_at, updated_at
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
        setSelectedCustomer(customer);
        setModalMode('edit');
        setShowCustomerModal(true);
    };

    // Crear nuevo cliente
    const handleCreateCustomer = () => {
        setSelectedCustomer(null);
        setModalMode('create');
        setShowCustomerModal(true);
    };

    // Ver cliente
    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setModalMode('view');
        setShowCustomerModal(true);
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
                            onClick={() => navigate('/configuracion')}
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
                            onClick={handleCreateCustomer}
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
                                    {customers.filter(c => c.last_visit_at && differenceInDays(new Date(), new Date(c.last_visit_at)) <= 60).length}
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
                                    onClick={handleCreateCustomer}
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
                                    onClick={() => handleViewCustomer(customer)}
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
                                                <p className="font-medium text-gray-900">{customer.visits_count || 0}</p>
                                                <p className="text-xs">Visitas</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium text-gray-900">€{(customer.total_spent || 0).toFixed(2)}</p>
                                                <p className="text-xs">Gastado</p>
                                            </div>
                                            {customer.last_visit_at && (
                                                <div className="text-center">
                                                    <p className="font-medium text-gray-900">
                                                        {format(parseISO(customer.last_visit_at), 'dd/MM')}
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

            {/* Modal Unificado de Cliente */}
                <CustomerModal
                customer={selectedCustomer}
                isOpen={showCustomerModal}
                    onClose={() => {
                    setShowCustomerModal(false);
                    setSelectedCustomer(null);
                    setModalMode('view');
                }}
                onSave={(updatedCustomer) => {
                    // Actualizar cliente en la lista
                    setCustomers(prev => {
                        if (modalMode === 'create') {
                            return [...prev, updatedCustomer];
                        } else {
                            return prev.map(c => 
                                c.id === updatedCustomer.id ? updatedCustomer : c
                            );
                        }
                    });
                    // Recargar datos completos
                    loadCustomers();
                }}
                restaurantId={restaurantId}
                mode={modalMode}
            />
        </div>
    );
};