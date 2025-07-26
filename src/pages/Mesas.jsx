import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Mesas = () => {
  const { user, restaurant } = useAuthContext();
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMesa, setEditingMesa] = useState(null);
  const [reservasHoy, setReservasHoy] = useState([]);

  // Estados para nueva mesa
  const [nuevaMesa, setNuevaMesa] = useState({
    numero: '',
    capacidad: 2,
    tipo: 'interior',
    estado: 'disponible',
    posicion_x: 50,
    posicion_y: 50
  });

  useEffect(() => {
    if (restaurant?.id) {
      cargarMesas();
      cargarReservasHoy();
    }
  }, [restaurant]);

  const cargarMesas = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('numero');

      if (error) throw error;
      setMesas(data || []);
    } catch (error) {
      console.error('Error cargando mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReservasHoy = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('reservations')
        .select('*, tables(numero)')
        .eq('restaurant_id', restaurant.id)
        .eq('fecha', hoy)
        .eq('estado', 'confirmada');

      if (error) throw error;
      setReservasHoy(data || []);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    }
  };

  const crearMesa = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert([{
          ...nuevaMesa,
          restaurant_id: restaurant.id
        }])
        .select();

      if (error) throw error;

      setMesas([...mesas, data[0]]);
      setShowAddModal(false);
      setNuevaMesa({
        numero: '',
        capacidad: 2,
        tipo: 'interior',
        estado: 'disponible',
        posicion_x: 50,
        posicion_y: 50
      });
    } catch (error) {
      console.error('Error creando mesa:', error);
      alert('Error al crear la mesa');
    }
  };

  const actualizarMesa = async (mesaId, cambios) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update(cambios)
        .eq('id', mesaId);

      if (error) throw error;

      setMesas(mesas.map(mesa => 
        mesa.id === mesaId ? { ...mesa, ...cambios } : mesa
      ));
    } catch (error) {
      console.error('Error actualizando mesa:', error);
    }
  };

  const eliminarMesa = async (mesaId) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) return;

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', mesaId);

      if (error) throw error;

      setMesas(mesas.filter(mesa => mesa.id !== mesaId));
      setSelectedMesa(null);
    } catch (error) {
      console.error('Error eliminando mesa:', error);
      alert('Error al eliminar la mesa');
    }
  };

  const obtenerEstadoMesa = (mesa) => {
    const reservaActiva = reservasHoy.find(r => 
      r.table_id === mesa.id && 
      new Date() >= new Date(`${r.fecha}T${r.hora}`) &&
      new Date() <= new Date(`${r.fecha}T${r.hora}`).getTime() + (2 * 60 * 60 * 1000) // 2 horas después
    );

    if (reservaActiva) return 'ocupada';
    if (mesa.estado === 'mantenimiento') return 'mantenimiento';
    return 'disponible';
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'disponible': return 'bg-green-500';
      case 'ocupada': return 'bg-red-500';
      case 'mantenimiento': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Mesas</h1>
          <p className="text-gray-600">Plano interactivo y configuración de mesas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Agregar Mesa
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">{mesas.length}</div>
          <div className="text-sm text-gray-600">Total Mesas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {mesas.filter(m => obtenerEstadoMesa(m) === 'disponible').length}
          </div>
          <div className="text-sm text-gray-600">Disponibles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">
            {mesas.filter(m => obtenerEstadoMesa(m) === 'ocupada').length}
          </div>
          <div className="text-sm text-gray-600">Ocupadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">
            {mesas.filter(m => obtenerEstadoMesa(m) === 'mantenimiento').length}
          </div>
          <div className="text-sm text-gray-600">Mantenimiento</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plano de mesas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Plano del Restaurante</h2>
              <p className="text-sm text-gray-600">Haz clic en una mesa para ver detalles</p>
            </div>
            <div className="p-4">
              <div 
                className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                style={{ height: '500px', minHeight: '400px' }}
              >
                {mesas.map((mesa) => {
                  const estado = obtenerEstadoMesa(mesa);
                  return (
                    <div
                      key={mesa.id}
                      className={`absolute w-16 h-16 rounded-lg border-2 border-white shadow-lg cursor-pointer transform hover:scale-110 transition-all duration-200 flex items-center justify-center text-white font-bold ${getColorEstado(estado)}`}
                      style={{
                        left: `${mesa.posicion_x}%`,
                        top: `${mesa.posicion_y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => setSelectedMesa(mesa)}
                    >
                      {mesa.numero}
                    </div>
                  );
                })}

                {mesas.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🪑</div>
                      <div>No hay mesas configuradas</div>
                      <div className="text-sm">Agrega tu primera mesa</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Leyenda */}
          <div className="bg-white rounded-lg shadow border p-4">
            <h3 className="font-semibold mb-3">Leyenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Ocupada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Mantenimiento</span>
              </div>
            </div>
          </div>

          {/* Detalles de mesa seleccionada */}
          {selectedMesa && (
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">Mesa {selectedMesa.numero}</h3>
                <button
                  onClick={() => setSelectedMesa(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Capacidad</label>
                  <div className="font-medium">{selectedMesa.capacidad} personas</div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Tipo</label>
                  <div className="font-medium capitalize">{selectedMesa.tipo}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Estado</label>
                  <div className={`inline-block px-2 py-1 rounded text-sm text-white ${getColorEstado(obtenerEstadoMesa(selectedMesa))}`}>
                    {obtenerEstadoMesa(selectedMesa)}
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <button
                    onClick={() => setEditingMesa(selectedMesa)}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Editar Mesa
                  </button>
                  <button
                    onClick={() => eliminarMesa(selectedMesa.id)}
                    className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Eliminar Mesa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de mesas */}
          <div className="bg-white rounded-lg shadow border p-4">
            <h3 className="font-semibold mb-3">Todas las Mesas</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mesas.map((mesa) => {
                const estado = obtenerEstadoMesa(mesa);
                return (
                  <div
                    key={mesa.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedMesa(mesa)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getColorEstado(estado)}`}></div>
                      <span className="font-medium">Mesa {mesa.numero}</span>
                    </div>
                    <span className="text-sm text-gray-600">{mesa.capacidad}p</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal agregar mesa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Agregar Nueva Mesa</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa
                </label>
                <input
                  type="text"
                  value={nuevaMesa.numero}
                  onChange={(e) => setNuevaMesa({...nuevaMesa, numero: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 1, A1, VIP-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <select
                  value={nuevaMesa.capacidad}
                  onChange={(e) => setNuevaMesa({...nuevaMesa, capacidad: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[2, 4, 6, 8, 10, 12].map(cap => (
                    <option key={cap} value={cap}>{cap} personas</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={nuevaMesa.tipo}
                  onChange={(e) => setNuevaMesa({...nuevaMesa, tipo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="interior">Interior</option>
                  <option value="terraza">Terraza</option>
                  <option value="barra">Barra</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posición X (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={nuevaMesa.posicion_x}
                    onChange={(e) => setNuevaMesa({...nuevaMesa, posicion_x: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posición Y (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={nuevaMesa.posicion_y}
                    onChange={(e) => setNuevaMesa({...nuevaMesa, posicion_y: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={crearMesa}
                disabled={!nuevaMesa.numero}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Crear Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mesas;

