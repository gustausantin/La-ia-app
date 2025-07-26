import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Configuracion = () => {
  const { user, restaurant } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados para configuración
  const [configGeneral, setConfigGeneral] = useState({
    nombre: '',
    descripcion: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    pais: 'España',
    sitio_web: '',
    tipo_cocina: '',
    precio_promedio: '',
    capacidad_total: 0
  });

  const [configHorarios, setConfigHorarios] = useState({
    lunes: { abierto: true, apertura: '12:00', cierre: '23:00', descanso_inicio: '16:00', descanso_fin: '19:00' },
    martes: { abierto: true, apertura: '12:00', cierre: '23:00', descanso_inicio: '16:00', descanso_fin: '19:00' },
    miercoles: { abierto: true, apertura: '12:00', cierre: '23:00', descanso_inicio: '16:00', descanso_fin: '19:00' },
    jueves: { abierto: true, apertura: '12:00', cierre: '23:00', descanso_inicio: '16:00', descanso_fin: '19:00' },
    viernes: { abierto: true, apertura: '12:00', cierre: '24:00', descanso_inicio: '16:00', descanso_fin: '19:00' },
    sabado: { abierto: true, apertura: '12:00', cierre: '24:00', descanso_inicio: '16:00', descanso_fin: '19:00' },
    domingo: { abierto: false, apertura: '12:00', cierre: '23:00', descanso_inicio: '16:00', descanso_fin: '19:00' }
  });

  const [configReservas, setConfigReservas] = useState({
    anticipacion_maxima: 30, // días
    anticipacion_minima: 2, // horas
    duracion_reserva: 120, // minutos
    confirmacion_automatica: true,
    recordatorio_email: true,
    recordatorio_sms: false,
    cancelacion_limite: 24, // horas
    deposito_requerido: false,
    deposito_cantidad: 0,
    maximo_personas: 12,
    minimo_personas: 1
  });

  const [configNotificaciones, setConfigNotificaciones] = useState({
    nueva_reserva: true,
    cancelacion: true,
    modificacion: true,
    recordatorio_staff: true,
    resumen_diario: true,
    email_notificaciones: '',
    whatsapp_notificaciones: '',
    telegram_notificaciones: ''
  });

  const [configIntegraciones, setConfigIntegraciones] = useState({
    google_calendar: false,
    whatsapp_business: false,
    mailchimp: false,
    stripe: false,
    google_reviews: false,
    tripadvisor: false,
    api_key_google: '',
    api_key_whatsapp: '',
    api_key_mailchimp: '',
    api_key_stripe: ''
  });

  useEffect(() => {
    if (restaurant?.id) {
      cargarConfiguracion();
    }
  }, [restaurant]);

  const cargarConfiguracion = async () => {
    try {
      // Cargar datos del restaurante
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurant.id)
        .single();

      if (error) throw error;

      if (restaurantData) {
        setConfigGeneral({
          nombre: restaurantData.nombre || '',
          descripcion: restaurantData.descripcion || '',
          telefono: restaurantData.telefono || '',
          email: restaurantData.email || '',
          direccion: restaurantData.direccion || '',
          ciudad: restaurantData.ciudad || '',
          codigo_postal: restaurantData.codigo_postal || '',
          pais: restaurantData.pais || 'España',
          sitio_web: restaurantData.sitio_web || '',
          tipo_cocina: restaurantData.tipo_cocina || '',
          precio_promedio: restaurantData.precio_promedio || '',
          capacidad_total: restaurantData.capacidad_total || 0
        });
      }

      // Cargar configuraciones adicionales (si existen en la BD)
      // Por ahora usamos valores por defecto

    } catch (error) {
      console.error('Error cargando configuración:', error);
      mostrarMensaje('error', 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = async () => {
    setSaving(true);
    try {
      // Guardar configuración general
      const { error } = await supabase
        .from('restaurants')
        .update({
          nombre: configGeneral.nombre,
          descripcion: configGeneral.descripcion,
          telefono: configGeneral.telefono,
          email: configGeneral.email,
          direccion: configGeneral.direccion,
          ciudad: configGeneral.ciudad,
          codigo_postal: configGeneral.codigo_postal,
          pais: configGeneral.pais,
          sitio_web: configGeneral.sitio_web,
          tipo_cocina: configGeneral.tipo_cocina,
          precio_promedio: configGeneral.precio_promedio,
          capacidad_total: configGeneral.capacidad_total,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      // Aquí se guardarían las otras configuraciones en tablas específicas
      // Por ahora solo guardamos la configuración general

      mostrarMensaje('success', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      mostrarMensaje('error', 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '🏪' },
    { id: 'horarios', label: 'Horarios', icon: '🕐' },
    { id: 'reservas', label: 'Reservas', icon: '📅' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
    { id: 'integraciones', label: 'Integraciones', icon: '🔗' }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona la configuración de tu restaurante</p>
        </div>
        <button
          onClick={guardarConfiguracion}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Mensaje de estado */}
      {mensaje.texto && (
        <div className={`p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Información General</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Restaurante *
                  </label>
                  <input
                    type="text"
                    value={configGeneral.nombre}
                    onChange={(e) => setConfigGeneral({...configGeneral, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de tu restaurante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cocina
                  </label>
                  <select
                    value={configGeneral.tipo_cocina}
                    onChange={(e) => setConfigGeneral({...configGeneral, tipo_cocina: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="mediterranea">Mediterránea</option>
                    <option value="italiana">Italiana</option>
                    <option value="japonesa">Japonesa</option>
                    <option value="mexicana">Mexicana</option>
                    <option value="francesa">Francesa</option>
                    <option value="fusion">Fusión</option>
                    <option value="vegetariana">Vegetariana</option>
                    <option value="mariscos">Mariscos</option>
                    <option value="carnes">Carnes</option>
                    <option value="tapas">Tapas</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={configGeneral.descripcion}
                    onChange={(e) => setConfigGeneral({...configGeneral, descripcion: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe tu restaurante..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={configGeneral.telefono}
                    onChange={(e) => setConfigGeneral({...configGeneral, telefono: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+34 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={configGeneral.email}
                    onChange={(e) => setConfigGeneral({...configGeneral, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contacto@restaurante.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={configGeneral.direccion}
                    onChange={(e) => setConfigGeneral({...configGeneral, direccion: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle, número"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={configGeneral.ciudad}
                    onChange={(e) => setConfigGeneral({...configGeneral, ciudad: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={configGeneral.codigo_postal}
                    onChange={(e) => setConfigGeneral({...configGeneral, codigo_postal: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="08001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={configGeneral.sitio_web}
                    onChange={(e) => setConfigGeneral({...configGeneral, sitio_web: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.restaurante.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Promedio (€)
                  </label>
                  <select
                    value={configGeneral.precio_promedio}
                    onChange={(e) => setConfigGeneral({...configGeneral, precio_promedio: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar rango</option>
                    <option value="10-20">€10-20 (Económico)</option>
                    <option value="20-35">€20-35 (Moderado)</option>
                    <option value="35-50">€35-50 (Medio-Alto)</option>
                    <option value="50+">€50+ (Alto)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad Total
                  </label>
                  <input
                    type="number"
                    value={configGeneral.capacidad_total}
                    onChange={(e) => setConfigGeneral({...configGeneral, capacidad_total: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Número total de comensales"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Horarios */}
          {activeTab === 'horarios' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Horarios de Apertura</h3>

              <div className="space-y-4">
                {Object.entries(configHorarios).map(([dia, horario]) => (
                  <div key={dia} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20">
                      <span className="font-medium capitalize">{dia}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={horario.abierto}
                        onChange={(e) => setConfigHorarios({
                          ...configHorarios,
                          [dia]: { ...horario, abierto: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm">Abierto</span>
                    </div>

                    {horario.abierto && (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Apertura:</span>
                          <input
                            type="time"
                            value={horario.apertura}
                            onChange={(e) => setConfigHorarios({
                              ...configHorarios,
                              [dia]: { ...horario, apertura: e.target.value }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Cierre:</span>
                          <input
                            type="time"
                            value={horario.cierre}
                            onChange={(e) => setConfigHorarios({
                              ...configHorarios,
                              [dia]: { ...horario, cierre: e.target.value }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Descanso:</span>
                          <input
                            type="time"
                            value={horario.descanso_inicio}
                            onChange={(e) => setConfigHorarios({
                              ...configHorarios,
                              [dia]: { ...horario, descanso_inicio: e.target.value }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <span className="text-sm">-</span>
                          <input
                            type="time"
                            value={horario.descanso_fin}
                            onChange={(e) => setConfigHorarios({
                              ...configHorarios,
                              [dia]: { ...horario, descanso_fin: e.target.value }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Reservas */}
          {activeTab === 'reservas' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configuración de Reservas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación Máxima (días)
                  </label>
                  <input
                    type="number"
                    value={configReservas.anticipacion_maxima}
                    onChange={(e) => setConfigReservas({...configReservas, anticipacion_maxima: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación Mínima (horas)
                  </label>
                  <input
                    type="number"
                    value={configReservas.anticipacion_minima}
                    onChange={(e) => setConfigReservas({...configReservas, anticipacion_minima: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de Reserva (minutos)
                  </label>
                  <select
                    value={configReservas.duracion_reserva}
                    onChange={(e) => setConfigReservas({...configReservas, duracion_reserva: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={90}>90 minutos</option>
                    <option value={120}>2 horas</option>
                    <option value={150}>2.5 horas</option>
                    <option value={180}>3 horas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de Cancelación (horas)
                  </label>
                  <input
                    type="number"
                    value={configReservas.cancelacion_limite}
                    onChange={(e) => setConfigReservas({...configReservas, cancelacion_limite: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Personas
                  </label>
                  <input
                    type="number"
                    value={configReservas.maximo_personas}
                    onChange={(e) => setConfigReservas({...configReservas, maximo_personas: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mínimo de Personas
                  </label>
                  <input
                    type="number"
                    value={configReservas.minimo_personas}
                    onChange={(e) => setConfigReservas({...configReservas, minimo_personas: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={configReservas.confirmacion_automatica}
                    onChange={(e) => setConfigReservas({...configReservas, confirmacion_automatica: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Confirmación Automática de Reservas
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={configReservas.recordatorio_email}
                    onChange={(e) => setConfigReservas({...configReservas, recordatorio_email: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Enviar Recordatorios por Email
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={configReservas.deposito_requerido}
                    onChange={(e) => setConfigReservas({...configReservas, deposito_requerido: e.target.checked})}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Requerir Depósito para Reservas
                  </label>
                </div>

                {configReservas.deposito_requerido && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad del Depósito (€)
                    </label>
                    <input
                      type="number"
                      value={configReservas.deposito_cantidad}
                      onChange={(e) => setConfigReservas({...configReservas, deposito_cantidad: parseFloat(e.target.value)})}
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configuración de Notificaciones</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Nueva Reserva</h4>
                    <p className="text-sm text-gray-600">Recibir notificación cuando se haga una nueva reserva</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configNotificaciones.nueva_reserva}
                    onChange={(e) => setConfigNotificaciones({...configNotificaciones, nueva_reserva: e.target.checked})}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Cancelaciones</h4>
                    <p className="text-sm text-gray-600">Recibir notificación cuando se cancele una reserva</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configNotificaciones.cancelacion}
                    onChange={(e) => setConfigNotificaciones({...configNotificaciones, cancelacion: e.target.checked})}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Modificaciones</h4>
                    <p className="text-sm text-gray-600">Recibir notificación cuando se modifique una reserva</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configNotificaciones.modificacion}
                    onChange={(e) => setConfigNotificaciones({...configNotificaciones, modificacion: e.target.checked})}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Resumen Diario</h4>
                    <p className="text-sm text-gray-600">Recibir resumen diario de reservas y métricas</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configNotificaciones.resumen_diario}
                    onChange={(e) => setConfigNotificaciones({...configNotificaciones, resumen_diario: e.target.checked})}
                    className="rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email para Notificaciones
                  </label>
                  <input
                    type="email"
                    value={configNotificaciones.email_notificaciones}
                    onChange={(e) => setConfigNotificaciones({...configNotificaciones, email_notificaciones: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="notificaciones@restaurante.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp para Notificaciones
                  </label>
                  <input
                    type="tel"
                    value={configNotificaciones.whatsapp_notificaciones}
                    onChange={(e) => setConfigNotificaciones({...configNotificaciones, whatsapp_notificaciones: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+34 XXX XXX XXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Integraciones */}
          {activeTab === 'integraciones' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Integraciones Externas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        📅
                      </div>
                      <div>
                        <h4 className="font-medium">Google Calendar</h4>
                        <p className="text-sm text-gray-600">Sincronizar reservas</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={configIntegraciones.google_calendar}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, google_calendar: e.target.checked})}
                      className="rounded"
                    />
                  </div>
                  {configIntegraciones.google_calendar && (
                    <input
                      type="text"
                      placeholder="API Key de Google"
                      value={configIntegraciones.api_key_google}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, api_key_google: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  )}
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        💬
                      </div>
                      <div>
                        <h4 className="font-medium">WhatsApp Business</h4>
                        <p className="text-sm text-gray-600">Confirmaciones automáticas</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={configIntegraciones.whatsapp_business}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, whatsapp_business: e.target.checked})}
                      className="rounded"
                    />
                  </div>
                  {configIntegraciones.whatsapp_business && (
                    <input
                      type="text"
                      placeholder="API Key de WhatsApp"
                      value={configIntegraciones.api_key_whatsapp}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, api_key_whatsapp: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  )}
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        📧
                      </div>
                      <div>
                        <h4 className="font-medium">Mailchimp</h4>
                        <p className="text-sm text-gray-600">Email marketing</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={configIntegraciones.mailchimp}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, mailchimp: e.target.checked})}
                      className="rounded"
                    />
                  </div>
                  {configIntegraciones.mailchimp && (
                    <input
                      type="text"
                      placeholder="API Key de Mailchimp"
                      value={configIntegraciones.api_key_mailchimp}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, api_key_mailchimp: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  )}
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        💳
                      </div>
                      <div>
                        <h4 className="font-medium">Stripe</h4>
                        <p className="text-sm text-gray-600">Pagos y depósitos</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={configIntegraciones.stripe}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, stripe: e.target.checked})}
                      className="rounded"
                    />
                  </div>
                  {configIntegraciones.stripe && (
                    <input
                      type="text"
                      placeholder="API Key de Stripe"
                      value={configIntegraciones.api_key_stripe}
                      onChange={(e) => setConfigIntegraciones({...configIntegraciones, api_key_stripe: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Próximamente</h4>
                <p className="text-sm text-blue-800">
                  Estamos trabajando en más integraciones: TripAdvisor, Google Reviews, Uber Eats, Glovo y más.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuracion;


