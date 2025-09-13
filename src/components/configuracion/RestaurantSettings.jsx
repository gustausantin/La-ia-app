import React, { useState, useCallback } from 'react';
import {
  Building2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Image,
  Save,
  Upload,
  Calendar,
  Utensils,
  Navigation,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RestaurantSettings = React.memo(({ restaurant, onUpdate }) => {
  const [settings, setSettings] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    cuisine_type: restaurant?.cuisine_type || '',
    phone: restaurant?.phone || '',
    email: restaurant?.email || '',
    website: restaurant?.website || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    postal_code: restaurant?.postal_code || '',
    capacity: restaurant?.capacity || 50,
    average_ticket: restaurant?.average_ticket || 45,
    
    // Horarios
    opening_hours: restaurant?.opening_hours || {
      monday: { open: '12:00', close: '23:00', closed: false },
      tuesday: { open: '12:00', close: '23:00', closed: false },
      wednesday: { open: '12:00', close: '23:00', closed: false },
      thursday: { open: '12:00', close: '23:00', closed: false },
      friday: { open: '12:00', close: '24:00', closed: false },
      saturday: { open: '12:00', close: '24:00', closed: false },
      sunday: { open: '12:00', close: '23:00', closed: false },
    },
    
    // Configuración de reservas
    booking_settings: restaurant?.booking_settings || {
      advance_booking_days: 30,
      min_booking_hours: 2,
      max_party_size: 12,
      require_confirmation: true,
      allow_modifications: true,
      cancellation_policy: '24h',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleInputChange = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNestedChange = useCallback((parent, field, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onUpdate(settings);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  }, [settings, onUpdate]);

  const InputField = ({ label, value, onChange, type = 'text', placeholder, required = false, help }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        required={required}
      />
      {help && <p className="text-xs text-gray-500">{help}</p>}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, required = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        required={required}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const DaySchedule = ({ day, schedule, onChange }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-20">
        <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!schedule.closed}
          onChange={(e) => onChange(day, 'closed', !e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <span className="text-sm text-gray-600">Abierto</span>
      </div>
      {!schedule.closed && (
        <>
          <input
            type="time"
            value={schedule.open}
            onChange={(e) => onChange(day, 'open', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
          <span className="text-gray-500">-</span>
          <input
            type="time"
            value={schedule.close}
            onChange={(e) => onChange(day, 'close', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </>
      )}
    </div>
  );

  const cuisineTypes = [
    { value: '', label: 'Seleccionar tipo de cocina' },
    { value: 'mediterranea', label: 'Mediterránea' },
    { value: 'italiana', label: 'Italiana' },
    { value: 'japonesa', label: 'Japonesa' },
    { value: 'mexicana', label: 'Mexicana' },
    { value: 'china', label: 'China' },
    { value: 'india', label: 'India' },
    { value: 'francesa', label: 'Francesa' },
    { value: 'americana', label: 'Americana' },
    { value: 'fusion', label: 'Fusión' },
    { value: 'vegetariana', label: 'Vegetariana' },
    { value: 'vegana', label: 'Vegana' },
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'reservas', label: 'Reservas', icon: Calendar },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-600" />
          Configuración del Restaurante
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Información básica y configuración general del establecimiento
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2 px-3 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2
                ${activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Nombre del Restaurante"
                value={settings.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Mi Restaurante"
                required
              />
              
              <SelectField
                label="Tipo de Cocina"
                value={settings.cuisine_type}
                onChange={(value) => handleInputChange('cuisine_type', value)}
                options={cuisineTypes}
              />
            </div>

            <InputField
              label="Descripción"
              value={settings.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Breve descripción del restaurante..."
              help="Esta descripción se usará en las reservas y promociones"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Teléfono"
                value={settings.phone}
                onChange={(value) => handleInputChange('phone', value)}
                type="tel"
                placeholder="+34 XXX XXX XXX"
              />
              
              <InputField
                label="Email"
                value={settings.email}
                onChange={(value) => handleInputChange('email', value)}
                type="email"
                placeholder="contacto@restaurante.com"
              />
            </div>

            <InputField
              label="Sitio Web"
              value={settings.website}
              onChange={(value) => handleInputChange('website', value)}
              type="url"
              placeholder="https://www.restaurante.com"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <InputField
                  label="Dirección"
                  value={settings.address}
                  onChange={(value) => handleInputChange('address', value)}
                  placeholder="Calle Principal 123"
                />
              </div>
              <InputField
                label="Código Postal"
                value={settings.postal_code}
                onChange={(value) => handleInputChange('postal_code', value)}
                placeholder="28001"
              />
            </div>

            <InputField
              label="Ciudad"
              value={settings.city}
              onChange={(value) => handleInputChange('city', value)}
              placeholder="Madrid"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Capacidad Total"
                value={settings.capacity}
                onChange={(value) => handleInputChange('capacity', parseInt(value) || 0)}
                type="number"
                placeholder="50"
                help="Número máximo de comensales"
              />
              
              <InputField
                label="Ticket Promedio (€)"
                value={settings.average_ticket}
                onChange={(value) => handleInputChange('average_ticket', parseFloat(value) || 0)}
                type="number"
                step="0.01"
                placeholder="45.00"
                help="Gasto promedio por persona"
              />
            </div>
          </div>
        )}

        {activeTab === 'horarios' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Horarios de Apertura</h4>
            </div>
            
            <div className="space-y-3">
              {Object.entries(settings.opening_hours).map(([day, schedule]) => (
                <DaySchedule
                  key={day}
                  day={day}
                  schedule={schedule}
                  onChange={(day, field, value) => 
                    handleNestedChange('opening_hours', day, { ...schedule, [field]: value })
                  }
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reservas' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Configuración de Reservas</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Días de Anticipación"
                value={settings.booking_settings.advance_booking_days}
                onChange={(value) => handleNestedChange('booking_settings', 'advance_booking_days', parseInt(value) || 0)}
                type="number"
                placeholder="30"
                help="Máximo días para reservar con anticipación"
              />
              
              <InputField
                label="Horas Mínimas de Anticipación"
                value={settings.booking_settings.min_booking_hours}
                onChange={(value) => handleNestedChange('booking_settings', 'min_booking_hours', parseInt(value) || 0)}
                type="number"
                placeholder="2"
                help="Tiempo mínimo para hacer una reserva"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Tamaño Máximo de Grupo"
                value={settings.booking_settings.max_party_size}
                onChange={(value) => handleNestedChange('booking_settings', 'max_party_size', parseInt(value) || 0)}
                type="number"
                placeholder="12"
                help="Número máximo de personas por reserva"
              />

              <SelectField
                label="Política de Cancelación"
                value={settings.booking_settings.cancellation_policy}
                onChange={(value) => handleNestedChange('booking_settings', 'cancellation_policy', value)}
                options={[
                  { value: '1h', label: '1 hora antes' },
                  { value: '2h', label: '2 horas antes' },
                  { value: '4h', label: '4 horas antes' },
                  { value: '24h', label: '24 horas antes' },
                  { value: '48h', label: '48 horas antes' },
                ]}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.booking_settings.require_confirmation}
                  onChange={(e) => handleNestedChange('booking_settings', 'require_confirmation', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Requerir confirmación de reservas
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.booking_settings.allow_modifications}
                  onChange={(e) => handleNestedChange('booking_settings', 'allow_modifications', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Permitir modificaciones de reservas
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
            Los cambios se guardan automáticamente
          </div>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
});

RestaurantSettings.displayName = 'RestaurantSettings';

export default RestaurantSettings;
