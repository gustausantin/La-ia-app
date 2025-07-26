import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Analytics = () => {
  const { user, restaurant } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('7d'); // 7d, 30d, 90d
  const [metricas, setMetricas] = useState({
    reservasTotal: 0,
    clientesTotal: 0,
    ocupacionPromedio: 0,
    ingresosTotales: 0,
    reservasCanceladas: 0,
    mesasMasPopulares: [],
    horasPico: [],
    tendenciaReservas: []
  });

  const [datosGraficos, setDatosGraficos] = useState({
    reservasPorDia: [],
    ocupacionPorHora: [],
    clientesPorMes: [],
    ingresosPorSemana: []
  });

  useEffect(() => {
    if (restaurant?.id) {
      cargarAnalyticas();
    }
  }, [restaurant, periodo]);

  const cargarAnalyticas = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarMetricasGenerales(),
        cargarDatosGraficos(),
        generarDatosPrueba() // Para demostración
      ]);
    } catch (error) {
      console.error('Error cargando analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMetricasGenerales = async () => {
    try {
      const fechaInicio = obtenerFechaInicio(periodo);

      // Reservas totales
      const { data: reservas, error: errorReservas } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('fecha', fechaInicio);

      if (errorReservas) throw errorReservas;

      // Clientes únicos
      const { data: clientes, error: errorClientes } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (errorClientes) throw errorClientes;

      // Mesas
      const { data: mesas, error: errorMesas } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (errorMesas) throw errorMesas;

      const reservasConfirmadas = reservas?.filter(r => r.estado === 'confirmada') || [];
      const reservasCanceladas = reservas?.filter(r => r.estado === 'cancelada') || [];

      // Calcular ocupación promedio
      const totalCapacidad = mesas?.reduce((sum, mesa) => sum + mesa.capacidad, 0) || 1;
      const reservasPersonas = reservasConfirmadas.reduce((sum, r) => sum + r.personas, 0);
      const ocupacionPromedio = Math.round((reservasPersonas / (totalCapacidad * getDiasEnPeriodo(periodo))) * 100);

      setMetricas({
        reservasTotal: reservasConfirmadas.length,
        clientesTotal: clientes?.length || 0,
        ocupacionPromedio: ocupacionPromedio,
        ingresosTotales: reservasConfirmadas.length * 45, // Estimado
        reservasCanceladas: reservasCanceladas.length,
        mesasMasPopulares: calcularMesasPopulares(reservasConfirmadas, mesas),
        horasPico: calcularHorasPico(reservasConfirmadas),
        tendenciaReservas: calcularTendencia(reservasConfirmadas)
      });

    } catch (error) {
      console.error('Error en métricas generales:', error);
    }
  };

  const cargarDatosGraficos = async () => {
    try {
      const fechaInicio = obtenerFechaInicio(periodo);

      const { data: reservas } = await supabase
        .from('reservations')
        .select('fecha, hora, personas, estado')
        .eq('restaurant_id', restaurant.id)
        .gte('fecha', fechaInicio)
        .eq('estado', 'confirmada');

      // Procesar datos para gráficos
      const reservasPorDia = procesarReservasPorDia(reservas || []);
      const ocupacionPorHora = procesarOcupacionPorHora(reservas || []);

      setDatosGraficos({
        reservasPorDia,
        ocupacionPorHora,
        clientesPorMes: generarDatosClientesPorMes(),
        ingresosPorSemana: generarDatosIngresosPorSemana()
      });

    } catch (error) {
      console.error('Error en datos de gráficos:', error);
    }
  };

  const generarDatosPrueba = async () => {
    // Generar datos de ejemplo para demostración
    try {
      // Verificar si ya existen datos de prueba
      const { data: existingData } = await supabase
        .from('reservations')
        .select('id')
        .eq('restaurant_id', restaurant.id)
        .limit(1);

      if (existingData && existingData.length > 0) return; // Ya hay datos

      // Generar clientes de ejemplo
      const clientesEjemplo = [];
      for (let i = 1; i <= 20; i++) {
        clientesEjemplo.push({
          restaurant_id: restaurant.id,
          nombre: `Cliente ${i}`,
          email: `cliente${i}@email.com`,
          telefono: `+34${600000000 + i}`,
          preferencias: i % 3 === 0 ? 'Vegetariano' : i % 2 === 0 ? 'Sin gluten' : null,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      const { data: clientesCreados } = await supabase
        .from('customers')
        .insert(clientesEjemplo)
        .select();

      // Generar reservas de ejemplo
      const reservasEjemplo = [];
      const hoy = new Date();

      for (let i = 0; i < 30; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));

        const horas = ['12:00', '13:00', '14:00', '20:00', '21:00', '22:00'];
        const hora = horas[Math.floor(Math.random() * horas.length)];

        reservasEjemplo.push({
          restaurant_id: restaurant.id,
          customer_id: clientesCreados[Math.floor(Math.random() * clientesCreados.length)].id,
          fecha: fecha.toISOString().split('T')[0],
          hora: hora,
          personas: Math.floor(Math.random() * 6) + 2,
          estado: Math.random() > 0.1 ? 'confirmada' : 'cancelada',
          notas: Math.random() > 0.7 ? 'Mesa junto a ventana' : null
        });
      }

      await supabase
        .from('reservations')
        .insert(reservasEjemplo);

    } catch (error) {
      console.error('Error generando datos de prueba:', error);
    }
  };

  // Funciones auxiliares
  const obtenerFechaInicio = (periodo) => {
    const hoy = new Date();
    switch (periodo) {
      case '7d':
        hoy.setDate(hoy.getDate() - 7);
        break;
      case '30d':
        hoy.setDate(hoy.getDate() - 30);
        break;
      case '90d':
        hoy.setDate(hoy.getDate() - 90);
        break;
    }
    return hoy.toISOString().split('T')[0];
  };

  const getDiasEnPeriodo = (periodo) => {
    switch (periodo) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  const calcularMesasPopulares = (reservas, mesas) => {
    const conteoMesas = {};
    reservas.forEach(reserva => {
      if (reserva.table_id) {
        conteoMesas[reserva.table_id] = (conteoMesas[reserva.table_id] || 0) + 1;
      }
    });

    return Object.entries(conteoMesas)
      .map(([tableId, count]) => {
        const mesa = mesas?.find(m => m.id === parseInt(tableId));
        return {
          mesa: mesa?.numero || 'N/A',
          reservas: count
        };
      })
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 5);
  };

  const calcularHorasPico = (reservas) => {
    const conteoHoras = {};
    reservas.forEach(reserva => {
      const hora = reserva.hora.split(':')[0];
      conteoHoras[hora] = (conteoHoras[hora] || 0) + 1;
    });

    return Object.entries(conteoHoras)
      .map(([hora, count]) => ({ hora: `${hora}:00`, reservas: count }))
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 3);
  };

  const calcularTendencia = (reservas) => {
    if (reservas.length < 2) return 0;

    const hoy = new Date();
    const mitadPeriodo = new Date(hoy);
    mitadPeriodo.setDate(mitadPeriodo.getDate() - getDiasEnPeriodo(periodo) / 2);

    const reservasRecientes = reservas.filter(r => new Date(r.fecha) >= mitadPeriodo);
    const reservasAnteriores = reservas.filter(r => new Date(r.fecha) < mitadPeriodo);

    const promedioReciente = reservasRecientes.length / (getDiasEnPeriodo(periodo) / 2);
    const promedioAnterior = reservasAnteriores.length / (getDiasEnPeriodo(periodo) / 2);

    return promedioAnterior > 0 ? Math.round(((promedioReciente - promedioAnterior) / promedioAnterior) * 100) : 0;
  };

  const procesarReservasPorDia = (reservas) => {
    const conteo = {};
    reservas.forEach(reserva => {
      const fecha = reserva.fecha;
      conteo[fecha] = (conteo[fecha] || 0) + 1;
    });

    return Object.entries(conteo)
      .map(([fecha, cantidad]) => ({
        fecha: new Date(fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        reservas: cantidad
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const procesarOcupacionPorHora = (reservas) => {
    const ocupacion = {};
    reservas.forEach(reserva => {
      const hora = reserva.hora.split(':')[0];
      ocupacion[hora] = (ocupacion[hora] || 0) + reserva.personas;
    });

    return Object.entries(ocupacion)
      .map(([hora, personas]) => ({
        hora: `${hora}:00`,
        ocupacion: personas
      }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
  };

  const generarDatosClientesPorMes = () => {
    return [
      { mes: 'Ene', clientes: 45 },
      { mes: 'Feb', clientes: 52 },
      { mes: 'Mar', clientes: 48 },
      { mes: 'Abr', clientes: 61 },
      { mes: 'May', clientes: 55 },
      { mes: 'Jun', clientes: 67 }
    ];
  };

  const generarDatosIngresosPorSemana = () => {
    return [
      { semana: 'S1', ingresos: 2400 },
      { semana: 'S2', ingresos: 2800 },
      { semana: 'S3', ingresos: 2200 },
      { semana: 'S4', ingresos: 3200 }
    ];
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Métricas y análisis de rendimiento</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 días' },
            { value: '30d', label: '30 días' },
            { value: '90d', label: '90 días' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setPeriodo(option.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                periodo === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reservas Totales</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.reservasTotal}</p>
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          {metricas.tendenciaReservas !== 0 && (
            <div className={`text-sm mt-2 ${metricas.tendenciaReservas > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metricas.tendenciaReservas > 0 ? '↗' : '↘'} {Math.abs(metricas.tendenciaReservas)}% vs período anterior
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.clientesTotal}</p>
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ocupación Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.ocupacionPromedio}%</p>
            </div>
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Estimados</p>
              <p className="text-2xl font-bold text-gray-900">€{metricas.ingresosTotales.toLocaleString()}</p>
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelaciones</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.reservasCanceladas}</p>
            </div>
            <div className="text-red-500">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservas por día */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Reservas por Día</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {datosGraficos.reservasPorDia.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${(item.reservas / Math.max(...datosGraficos.reservasPorDia.map(d => d.reservas))) * 200}px` }}
                ></div>
                <div className="text-xs text-gray-600 mt-2">{item.fecha}</div>
                <div className="text-xs font-semibold">{item.reservas}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ocupación por hora */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Ocupación por Hora</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {datosGraficos.ocupacionPorHora.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600"
                  style={{ height: `${(item.ocupacion / Math.max(...datosGraficos.ocupacionPorHora.map(d => d.ocupacion))) * 200}px` }}
                ></div>
                <div className="text-xs text-gray-600 mt-2">{item.hora}</div>
                <div className="text-xs font-semibold">{item.ocupacion}p</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights y rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mesas más populares */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Mesas Más Populares</h3>
          <div className="space-y-3">
            {metricas.mesasMasPopulares.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">Mesa {item.mesa}</span>
                </div>
                <span className="text-gray-600">{item.reservas} reservas</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horas pico */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Horas Pico</h3>
          <div className="space-y-3">
            {metricas.horasPico.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.hora}</span>
                </div>
                <span className="text-gray-600">{item.reservas} reservas</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">💡 Recomendaciones Inteligentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Optimización de Horarios</h4>
            <p className="text-sm text-gray-600">
              Considera ofrecer promociones en horarios de menor ocupación para equilibrar la demanda.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Gestión de Mesas</h4>
            <p className="text-sm text-gray-600">
              Las mesas más populares podrían beneficiarse de turnos más cortos en horas pico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

