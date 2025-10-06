// ======================================================================
// COMPONENTE: ReservationWizard - Wizard paso a paso para reservas
// ======================================================================
// UI moderna con validación en tiempo real y sugerencias inteligentes
// ======================================================================

import React from 'react';
import {
  Phone,
  Calendar,
  Clock,
  Users,
  UtensilsCrossed,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  MessageSquare,
  X,
  Sparkles
} from 'lucide-react';
import { useReservationWizard } from '../../hooks/useReservationWizard';
import { AlternativeTimesModal } from './AlternativeTimesModal';

/**
 * Componente principal del wizard de reservas
 */
export const ReservationWizard = ({ restaurantId, initialData = null, onSave, onCancel }) => {
  const wizard = useReservationWizard(restaurantId, initialData);

  const {
    currentStep,
    formData,
    validations,
    existingCustomer,
    availableTables,
    isLoading,
    loadingTables,
    STEPS,
    suggestedTimes,
    showAlternativesModal,
    handleFieldChange,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isCurrentStepValid,
    handleSelectAlternative,
    openAlternativesModal,
    closeAlternativesModal
  } = wizard;

  // Handler para guardar reserva
  const handleSave = async () => {
    if (!isCurrentStepValid()) {
      return;
    }

    // Construir nombre completo
    const fullName = `${formData.firstName} ${formData.lastName1} ${formData.lastName2 || ''}`.trim();

    // Validar todos los campos antes de guardar
    const finalData = {
      restaurant_id: restaurantId,
      customer_id: formData.customerId,
      customer_name: fullName,
      first_name: formData.firstName,
      last_name1: formData.lastName1,
      last_name2: formData.lastName2 || null,
      customer_email: formData.customerEmail || null,
      customer_phone: formData.customerPhone,
      // birthdate NO va en reservations, va en customers
      reservation_date: formData.date,
      reservation_time: formData.time,
      party_size: parseInt(formData.partySize),
      table_id: formData.tableId,
      special_requests: formData.specialRequests || null,
      status: 'confirmed',
      channel: 'manual',
      source: 'dashboard'
    };

    console.log('📝 Guardando reserva:', finalData);
    await onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">
              {initialData ? 'Modificar Reserva' : 'Nueva Reserva'}
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              {STEPS[currentStep - 1]?.name} - Paso {currentStep} de {STEPS.length}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={index >= currentStep}
                  className={`flex flex-col items-center gap-1 ${
                    index < currentStep - 1
                      ? 'text-green-600 cursor-pointer hover:text-green-700'
                      : index === currentStep - 1
                      ? 'text-blue-600'
                      : 'text-gray-300'
                  } transition-colors disabled:cursor-not-allowed`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium ${
                      index < currentStep - 1
                        ? 'bg-green-100 text-green-600'
                        : index === currentStep - 1
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {index < currentStep - 1 ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStep - 1 ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* PASO 1: CLIENTE */}
          {currentStep === 1 && (
            <StepCustomer
              formData={formData}
              existingCustomer={existingCustomer}
              onChange={handleFieldChange}
            />
          )}

          {/* PASO 2: FECHA */}
          {currentStep === 2 && (
            <StepDate
              formData={formData}
              validation={validations.date}
              isLoading={isLoading}
              onChange={handleFieldChange}
            />
          )}

          {/* PASO 3: HORA */}
          {currentStep === 3 && (
            <StepTime
              formData={formData}
              validation={validations.time}
              isLoading={isLoading}
              onChange={handleFieldChange}
              suggestedTimes={suggestedTimes}
              onSelectAlternative={handleSelectAlternative}
              onShowMore={openAlternativesModal}
            />
          )}

          {/* PASO 4: PERSONAS */}
          {currentStep === 4 && (
            <StepPartySize
              formData={formData}
              validation={validations.partySize}
              isLoading={isLoading}
              onChange={handleFieldChange}
            />
          )}

          {/* PASO 5: MESA */}
          {currentStep === 5 && (
            <StepTable
              formData={formData}
              validation={validations.table}
              availableTables={availableTables}
              loadingTables={loadingTables}
              onChange={handleFieldChange}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={currentStep === 1 ? onCancel : goToPreviousStep}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {currentStep === 1 ? (
              <>
                <X className="w-4 h-4" />
                Cancelar
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </>
            )}
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={goToNextStep}
              disabled={!isCurrentStepValid()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!isCurrentStepValid() || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {initialData ? 'Actualizar' : 'Crear Reserva'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE HORARIOS ALTERNATIVOS */}
      <AlternativeTimesModal
        isOpen={showAlternativesModal}
        onClose={closeAlternativesModal}
        onSelectTime={handleSelectAlternative}
        alternatives={suggestedTimes}
        date={formData.date}
        partySize={formData.partySize}
        requestedTime={formData.time}
      />
    </div>
  );
};

// ======================================================================
// PASO 1: CLIENTE
// ======================================================================
const StepCustomer = ({ formData, existingCustomer, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">📱 Datos del Cliente</h3>
        <p className="text-sm text-gray-600">
          Introduce el teléfono para buscar el cliente o crear uno nuevo
        </p>
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="w-4 h-4 inline mr-2" />
          Teléfono *
        </label>
        <input
          type="tel"
          value={formData.customerPhone}
          onChange={(e) => onChange('customerPhone', e.target.value)}
          placeholder="+34 600 000 000"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Cliente existente */}
      {existingCustomer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
            <Check className="w-5 h-5" />
            Cliente encontrado
          </div>
          <div className="text-sm text-green-700">
            <p><strong>{existingCustomer.name}</strong></p>
            {existingCustomer.email && <p>{existingCustomer.email}</p>}
            <p className="text-xs mt-1">
              {existingCustomer.total_visits || 0} visita(s) · Segmento: {existingCustomer.segment_auto || 'Nuevo'}
            </p>
          </div>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Nombre *
        </label>
        <input
          type="text"
          value={formData.firstName || ''}
          onChange={(e) => onChange('firstName', e.target.value)}
          placeholder="Juan"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Apellido 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Primer apellido *
        </label>
        <input
          type="text"
          value={formData.lastName1 || ''}
          onChange={(e) => onChange('lastName1', e.target.value)}
          placeholder="García"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Apellido 2 (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Segundo apellido (opcional)
        </label>
        <input
          type="text"
          value={formData.lastName2 || ''}
          onChange={(e) => onChange('lastName2', e.target.value)}
          placeholder="Martínez"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Email (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="w-4 h-4 inline mr-2" />
          Email (opcional)
        </label>
        <input
          type="email"
          value={formData.customerEmail}
          onChange={(e) => onChange('customerEmail', e.target.value)}
          placeholder="juan@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Fecha de cumpleaños (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎂 Fecha de cumpleaños (opcional)
        </label>
        <input
          type="date"
          value={formData.birthdate || ''}
          onChange={(e) => onChange('birthdate', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

// ======================================================================
// PASO 2: FECHA
// ======================================================================
const StepDate = ({ formData, validation, isLoading, onChange }) => {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 Selecciona la Fecha</h3>
        <p className="text-sm text-gray-600">
          Elige el día de la reserva (máximo 30 días de antelación)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-2" />
          Fecha de la reserva *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => onChange('date', e.target.value)}
          min={today}
          max={maxDateStr}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Validación en tiempo real */}
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verificando disponibilidad...
        </div>
      )}

      {!isLoading && validation.valid === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
        </div>
      )}

      {!isLoading && validation.valid === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ======================================================================
// PASO 3: HORA
// ======================================================================
const StepTime = ({ formData, validation, isLoading, onChange, suggestedTimes = [], onSelectAlternative, onShowMore }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🕐 Selecciona la Hora</h3>
        <p className="text-sm text-gray-600">
          Elige la hora de la reserva
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-2" />
          Hora de la reserva *
        </label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => onChange('time', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Validación en tiempo real */}
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verificando disponibilidad...
        </div>
      )}

      {!isLoading && validation.valid === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
          {validation.availableSlots > 0 && (
            <p className="text-sm text-green-700 mt-1">
              ✅ {validation.availableSlots} mesa(s) disponible(s)
            </p>
          )}
        </div>
      )}

      {!isLoading && validation.valid === false && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{validation.message}</span>
            </div>
          </div>

          {/* 🚀 CHIPS DE SUGERENCIAS INMEDIATAS */}
          {suggestedTimes && suggestedTimes.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <p className="font-medium text-gray-900">¿Te va alguna de estas horas?</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedTimes.slice(0, 4).map((alternative, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectAlternative(alternative)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-purple-300 text-purple-700 font-semibold rounded-lg hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all transform hover:scale-105 shadow-sm"
                  >
                    <Clock className="w-4 h-4" />
                    {alternative.displayTime}
                    {alternative.availableTables && (
                      <span className="text-xs opacity-75">
                        ({alternative.availableTables} mesa{alternative.availableTables > 1 ? 's' : ''})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {suggestedTimes.length > 4 && (
                <button
                  onClick={onShowMore}
                  className="w-full px-4 py-2 bg-white border border-purple-300 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Ver más opciones ({suggestedTimes.length - 4} más)
                </button>
              )}
            </div>
          )}
          
          {/* Alternativas legacy (por compatibilidad) */}
          {validation.alternatives && validation.alternatives.length > 0 && suggestedTimes.length === 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Horarios alternativos disponibles:
              </p>
              <div className="flex flex-wrap gap-2">
                {validation.alternatives.map((alt, index) => (
                  <button
                    key={index}
                    onClick={() => onChange('time', alt.time)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                  >
                    {alt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ======================================================================
// PASO 4: PERSONAS
// ======================================================================
const StepPartySize = ({ formData, validation, isLoading, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Número de Comensales</h3>
        <p className="text-sm text-gray-600">
          ¿Para cuántas personas es la reserva?
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="w-4 h-4 inline mr-2" />
          Número de personas *
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={formData.partySize || ''}
          onChange={(e) => onChange('partySize', e.target.value)}
          onBlur={(e) => {
            if (!e.target.value || e.target.value === '') {
              onChange('partySize', 1);
            }
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
        />
        <p className="text-xs text-gray-500 mt-1">
          Puedes ajustar el número manualmente o usar las flechas
        </p>
      </div>

      {/* Validación en tiempo real */}
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Validando...
        </div>
      )}

      {!isLoading && validation.valid === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
          {validation.warning && (
            <p className="text-sm text-orange-700 mt-2">⚠️ {validation.warning}</p>
          )}
        </div>
      )}

      {!isLoading && validation.valid === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ======================================================================
// PASO 5: MESA
// ======================================================================
const StepTable = ({ formData, validation, availableTables, loadingTables, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🪑 Selecciona la Mesa</h3>
        <p className="text-sm text-gray-600">
          Elige la mesa para la reserva (solo se muestran mesas disponibles con capacidad suficiente)
        </p>
      </div>

      {/* Peticiones especiales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Peticiones especiales (opcional)
        </label>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => onChange('specialRequests', e.target.value)}
          placeholder="Alergia, ventana, terraza, celebración..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Lista de mesas disponibles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <UtensilsCrossed className="w-4 h-4 inline mr-2" />
          Mesa *
        </label>

        {loadingTables && (
          <div className="flex items-center gap-2 text-gray-600 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            Buscando mesas disponibles...
          </div>
        )}

        {!loadingTables && availableTables.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                No hay mesas disponibles para {formData.partySize} persona(s) a las{' '}
                {formData.time ? formData.time.substring(0, 5) : ''}
              </span>
            </div>
            <p className="text-sm text-red-700 mt-2">
              💡 Prueba con otra hora o reduce el número de comensales
            </p>
          </div>
        )}

        {!loadingTables && availableTables.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {availableTables.map((table) => (
              <button
                key={table.id}
                onClick={() => onChange('tableId', table.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formData.tableId === table.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">
                    Mesa {table.table_number || table.name}
                  </span>
                  {formData.tableId === table.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p>👥 Capacidad: {table.capacity} personas</p>
                  {table.zone && <p>📍 {table.zone}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Validación de mesa */}
      {!loadingTables && validation.valid === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
        </div>
      )}

      {!loadingTables && validation.valid === false && validation.message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{validation.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationWizard;

