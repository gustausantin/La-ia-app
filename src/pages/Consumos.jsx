// Consumos.jsx - Página para vincular reservas con tickets POS
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Link2, Unlink, Eye, DollarSign, Clock, Users, 
    CheckCircle2, AlertTriangle, RefreshCw, Filter,
    Receipt, Calendar, Search, TrendingUp, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const Consumos = () => {
    const { restaurant, restaurantId, isReady } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [matches, setMatches] = useState([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showDetails, setShowDetails] = useState({});
    const [stats, setStats] = useState({
        totalReservations: 0,
        linkedReservations: 0,
        pendingMatches: 0,
        totalRevenue: 0,
        avgTicket: 0
    });

    // Cargar datos del día seleccionado
    const loadData = useCallback(async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);

            // Cargar reservas del día
            const { data: reservationsData, error: reservationsError } = await supabase
                .from('reservations')
                .select(`
                    id, customer_name, customer_phone, customer_email,
                    reservation_date, reservation_time, party_size, status,
                    table_number, special_requests, created_at
                `)
                .eq('restaurant_id', restaurantId)
                .eq('reservation_date', selectedDate)
                .order('reservation_time');

            if (reservationsError) throw reservationsError;

            // 🔧 USAR TABLA EXISTENTE: billing_tickets en lugar de pos_receipts
            const { data: receiptsData, error: receiptsError } = await supabase
                .from('billing_tickets')
                .select(`
                    id, external_ticket_id, ticket_number, mesa_number,
                    ticket_date, service_start, service_end,
                    total_amount, payment_method, auto_matched, confidence_score
                `)
                .eq('restaurant_id', restaurantId)
                .gte('ticket_date', selectedDate + ' 00:00:00')
                .lte('ticket_date', selectedDate + ' 23:59:59')
                .order('ticket_date');

            if (receiptsError) throw receiptsError;

            // Cargar matches existentes
            const { data: matchesData, error: matchesError } = await supabase
                .from('reservation_receipt_map')
                .select(`
                    id, reservation_id, receipt_id, confidence, status,
                    linked_by, linked_at, notes
                `)
                .in('reservation_id', (reservationsData || []).map(r => r.id));

            if (matchesError) throw matchesError;

            // Obtener sugerencias automáticas para reservas sin vincular
            const unlinkedReservations = (reservationsData || []).filter(r => 
                !(matchesData || []).some(m => m.reservation_id === r.id && m.status === 'linked')
            );

            let suggestionsData = [];
            if (unlinkedReservations.length > 0) {
                const { data: suggestions, error: suggestionsError } = await supabase
                    .rpc('crm_v2_suggest_receipt_matches', {
                        p_restaurant_id: restaurantId
                    });

                if (!suggestionsError) {
                    suggestionsData = suggestions || [];
                }
            }

            // Combinar matches existentes con sugerencias
            const allMatches = [
                ...(matchesData || []),
                ...suggestionsData.map(s => ({
                    id: `suggestion_${s.reservation_id}_${s.receipt_id}`,
                    reservation_id: s.reservation_id,
                    receipt_id: s.receipt_id,
                    confidence: s.confidence,
                    status: 'pending',
                    linked_by: 'auto',
                    reason: s.reason,
                    tiempo_diff_minutes: s.tiempo_diff_minutes
                }))
            ];

            // Calcular estadísticas
            const totalRevenue = (receiptsData || []).reduce((sum, r) => sum + parseFloat(r.total || 0), 0);
            const linkedCount = (matchesData || []).filter(m => m.status === 'linked').length;
            const pendingCount = allMatches.filter(m => m.status === 'pending').length;

            setReservations(reservationsData || []);
            setReceipts(receiptsData || []);
            setMatches(allMatches);
            setStats({
                totalReservations: (reservationsData || []).length,
                linkedReservations: linkedCount,
                pendingMatches: pendingCount,
                totalRevenue,
                avgTicket: (receiptsData || []).length > 0 ? totalRevenue / (receiptsData || []).length : 0
            });

        } catch (error) {
            console.error('Error loading consumos data:', error);
            toast.error('Error al cargar datos de consumos');
        } finally {
            setLoading(false);
        }
    }, [restaurantId, selectedDate]);

    // Vincular reserva con ticket
    const linkReservationReceipt = async (reservationId, receiptId, confidence = 1.0) => {
        try {
            const { data, error } = await supabase
                .rpc('crm_v2_link_reservation_receipt', {
                    p_reservation_id: reservationId,
                    p_receipt_id: receiptId,
                    p_linked_by: 'manual',
                    p_confidence: confidence
                });

            if (error) throw error;

            if (data.success) {
                toast.success('Vínculo creado exitosamente');
                loadData(); // Recargar datos
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error linking reservation-receipt:', error);
            toast.error('Error al crear el vínculo');
        }
    };

    // Desvincular
    const unlinkReservationReceipt = async (reservationId, receiptId) => {
        try {
            const { error } = await supabase
                .from('reservation_receipt_map')
                .delete()
                .eq('reservation_id', reservationId)
                .eq('receipt_id', receiptId);

            if (error) throw error;

            toast.success('Vínculo eliminado');
            loadData();
        } catch (error) {
            console.error('Error unlinking:', error);
            toast.error('Error al eliminar el vínculo');
        }
    };

    // Obtener detalles de items de un ticket
    const getReceiptItems = useCallback(async (receiptId) => {
        try {
            const { data, error } = await supabase
                .from('pos_items')
                .select('*')
                .eq('receipt_id', receiptId)
                .order('categoria', 'nombre');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading receipt items:', error);
            return [];
        }
    }, []);

    // Toggle detalles de ticket
    const toggleDetails = async (receiptId) => {
        if (showDetails[receiptId]) {
            setShowDetails(prev => ({ ...prev, [receiptId]: null }));
        } else {
            const items = await getReceiptItems(receiptId);
            setShowDetails(prev => ({ ...prev, [receiptId]: items }));
        }
    };

    // Efectos
    useEffect(() => {
        if (isReady && restaurantId) {
            loadData();
        }
    }, [isReady, restaurantId, loadData]);

    // Funciones auxiliares
    const getMatchForReservation = (reservationId) => {
        return matches.find(m => m.reservation_id === reservationId);
    };

    const getReceiptForMatch = (receiptId) => {
        return receipts.find(r => r.id === receiptId);
    };

    const formatTime = (timeString) => {
        return timeString ? timeString.slice(0, 5) : '';
    };

    const getStatusColor = (status, confidence) => {
        switch (status) {
            case 'linked': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': 
                if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando datos de consumos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Receipt className="w-6 h-6 text-purple-600" />
                            Consumos
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Vincula reservas con tickets del sistema POS
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Selector de fecha */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <button
                            onClick={loadData}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">Reservas</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{stats.totalReservations}</div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Link2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Vinculadas</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{stats.linkedReservations}</div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600 font-medium">Pendientes</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-900">{stats.pendingMatches}</div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">Facturación</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">{stats.totalRevenue.toFixed(0)}€</div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm text-indigo-600 font-medium">Ticket Medio</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">{stats.avgTicket.toFixed(0)}€</div>
                    </div>
                </div>
            </div>

            {/* Lista de reservas con vínculos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Reservas del {format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: es })}
                    </h2>
                </div>

                <div className="divide-y divide-gray-200">
                    {reservations.map((reservation) => {
                        const match = getMatchForReservation(reservation.id);
                        const receipt = match ? getReceiptForMatch(match.receipt_id) : null;
                        const items = receipt ? showDetails[receipt.id] : null;

                        return (
                            <div key={reservation.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    {/* Info de la reserva */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {reservation.customer_name}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                Mesa {reservation.table_number}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {formatTime(reservation.reservation_time)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {reservation.party_size} personas
                                            </span>
                                        </div>

                                        {reservation.customer_phone && (
                                            <p className="text-sm text-gray-600">
                                                📞 {reservation.customer_phone}
                                            </p>
                                        )}
                                    </div>

                                    {/* Estado del vínculo */}
                                    <div className="flex items-center gap-3">
                                        {match ? (
                                            <>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(match.status, match.confidence)}`}>
                                                    {match.status === 'linked' ? 'Vinculada' : 'Sugerencia'} 
                                                    {match.confidence && ` (${Math.round(match.confidence * 100)}%)`}
                                                </span>
                                                
                                                {receipt && (
                                                    <div className="text-right">
                                                        <div className="font-semibold text-gray-900">
                                                            {receipt.total}€
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {format(parseISO(receipt.closed_at), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                Sin vincular
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket vinculado */}
                                {receipt && (
                                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        Ticket #{receipt.external_id || receipt.id.slice(0, 8)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Mesa {receipt.mesa} • {receipt.payment_method || 'N/A'}
                                                    </div>
                                                </div>
                                                
                                                {match.reason && (
                                                    <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                        {match.reason}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleDetails(receipt.id)}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {items ? 'Ocultar' : 'Ver items'}
                                                </button>

                                                {match.status === 'linked' ? (
                                                    <button
                                                        onClick={() => unlinkReservationReceipt(reservation.id, receipt.id)}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700"
                                                    >
                                                        <Unlink className="w-4 h-4" />
                                                        Desvincular
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => linkReservationReceipt(reservation.id, receipt.id, match.confidence)}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Confirmar
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Items del ticket */}
                                        {items && items.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                    {items.map((item, index) => (
                                                        <div key={index} className="flex justify-between">
                                                            <span className="text-gray-700">
                                                                {item.qty}x {item.nombre}
                                                                {item.categoria && (
                                                                    <span className="text-gray-500 ml-1">
                                                                        ({item.categoria})
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium">
                                                                {item.precio_total}€
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {reservations.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No hay reservas para el día seleccionado</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Consumos;
