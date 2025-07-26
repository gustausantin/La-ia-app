import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Calendario = () => {
  const { user, restaurant } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [reservas, setReservas] = useState([]);
  const [vistaActual, setVistaActual] = useState('mes'); // mes, semana, dia
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas'); // todas, confirmada, pendiente, cancelada

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    if (restaurant?.id) {
      cargarReservas();
    }
  }, [restaurant, fechaActual, filtroEstado]);

  const cargarReservas = async () => {
    try {
      const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

      let query = supabase
        .from('reservations')
        .select(`
          *,
          customers (nombre, telefono, email),
          tables (numero, capacidad)
        `)
        .eq('restaurant_id', restaurant.id)
        .gte('fecha', inicioMes.toISOString().split('T')[0])
        .lte('fecha', finMes.toISOString().split('T')[0])
        .order('fecha')
        .order('hora');

      if (filtroEstado !== 'todas') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReservas(data || []);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const obtenerDiasDelMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias = [];

    // Días del mes anterior para completar la primera semana
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(año, mes, -i);
      dias.push({
        fecha: dia,
        esDelMes: false,
        numero: dia.getDate()
      });
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      dias.push({
        fecha,
        esDelMes: true,
        numero: dia
      });
    }

    // Días del mes siguiente para completar la última semana
    const diasRestantes = 42 - dias.length; // 6 semanas * 7 días
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(año, mes + 1, dia);
      dias.push({
        fecha,
        esDelMes: false,
        numero: dia
      });
    }

    return dias;
  };

  const obtenerReservasDelDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return reservas.filter(reserva => reserva.fecha === fechaStr);
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'confirmada': return 'bg-green-500';
      case 'pendiente': return 'bg-yellow-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const actualizarEstadoReserva = async (reservaId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ estado: nuevoEstado })
        .eq('id', reservaId);

      if (error) throw error;

      setReservas(reservas.map(r => 
        r.id === reservaId ? { ...r, estado: nuevoEstado } : r
      ));

      if (reservaSeleccionada?.id === reservaId) {
        setReservaSeleccionada({ ...reservaSeleccionada, estado: nuevoEstado });
      }
    } catch (error) {
      console.error('Error actualizando reserva:', error);
      alert('Error al actualizar la reserva');
    }
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esFuturo = (fecha) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha >= hoy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-600">Vista mensual de reservas y disponibilidad</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filtro de estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todas">Todas las reservas</option>
            <option value="confirmada">Confirmadas</option>
            <option value="pendiente">Pendientes</option>
            <option value="cancelada">Canceladas</option>
          </select>

          {/* Navegación de mes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => cambiarMes(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </h2>
            <button
              onClick={() => cambiarMes(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          <button
            onClick={() => setFechaActual(new Date())}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {reservas.filter(r => r.estado === 'confirmada').length}
          </div>
          <div className="text-sm text-gray-600">Reservas Confirmadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">
            {reservas.filter(r => r.estado === 'pendiente').length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">
            {reservas.filter(r => r.estado === 'cancelada').length}
          </div>
          <div className="text-sm text-gray-600">Canceladas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {reservas.reduce((sum, r) => r.estado === 'confirmada' ? sum + r.personas : sum, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Comensales</div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow border">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {diasSemana.map((dia) => (
            <div key={dia} className="p-4 text-center font-semibold text-gray-700 bg-gray-50">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {obtenerDiasDelMes().map((dia, index) => {
            const reservasDelDia = obtenerReservasDelDia(dia.fecha);
            const esHoyDia = esHoy(dia.fecha);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                  !dia.esDelMes ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${esHoyDia ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  esHoyDia ? 'text-blue-600' : dia.esDelMes ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {dia.numero}
                  {esHoyDia && <span className="ml-1 text-xs">(Hoy)</span>}
                </div>

                <div className="space-y-1">
                  {reservasDelDia.slice(0, 3).map((reserva) => (
                    <div
                      key={reserva.id}
                      onClick={() => {
                        setReservaSeleccionada(reserva);
                        setShowDetalles(true);
                      }}
                      className={`text-xs p-1 rounded cursor-pointer text-white ${obtenerColorEstado(reserva.estado)} hover:opacity-80 transition-opacity`}
                    >
                      <div className="font-medium">{reserva.hora}</div>
                      <div className="truncate">
                        {reserva.customers?.nombre || 'Sin nombre'} ({reserva.personas}p)
                      </div>
                    </div>
                  ))}

                  {reservasDelDia.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{reservasDelDia.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de detalles de reserva */}
      {showDetalles && reservaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Detalles de Reserva</h3>
              <button
                onClick={() => setShowDetalles(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Cliente</label>
                <div className="font-medium">{reservaSeleccionada.customers?.nombre || 'Sin nombre'}</div>
                {reservaSeleccionada.customers?.telefono && (
                  <div className="text-sm text-gray-600">{reservaSeleccionada.customers.telefono}</div>
                )}
                {reservaSeleccionada.customers?.email && (
                  <div className="text-sm text-gray-600">{reservaSeleccionada.customers.email}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Fecha</label>
                  <div className="font-medium">
                    {new Date(reservaSeleccionada.fecha).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Hora</label>
                  <div className="font-medium">{reservaSeleccionada.hora}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Personas</label>
                  <div className="font-medium">{reservaSeleccionada.personas}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mesa</label>
                  <div className="font-medium">
                    {reservaSeleccionada.tables?.numero || 'Sin asignar'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <div className={`inline-block px-2 py-1 rounded text-sm text-white ${obtenerColorEstado(reservaSeleccionada.estado)}`}>
                  {reservaSeleccionada.estado}
                </div>
              </div>

              {reservaSeleccionada.notas && (
                <div>
                  <label className="text-sm text-gray-600">Notas</label>
                  <div className="text-sm bg-gray-50 p-2 rounded">{reservaSeleccionada.notas}</div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                {reservaSeleccionada.estado === 'pendiente' && (
                  <>
                    <button
                      onClick={() => actualizarEstadoReserva(reservaSeleccionada.id, 'confirmada')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => actualizarEstadoReserva(reservaSeleccionada.id, 'cancelada')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}

                {reservaSeleccionada.estado === 'confirmada' && esFuturo(new Date(reservaSeleccionada.fecha)) && (
                  <button
                    onClick={() => actualizarEstadoReserva(reservaSeleccionada.id, 'cancelada')}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancelar Reserva
                  </button>
                )}

                {reservaSeleccionada.estado === 'cancelada' && esFuturo(new Date(reservaSeleccionada.fecha)) && (
                  <button
                    onClick={() => actualizarEstadoReserva(reservaSeleccionada.id, 'confirmada')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Reactivar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h3 className="font-semibold mb-3">Leyenda</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Cancelada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm">Día actual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendario;


