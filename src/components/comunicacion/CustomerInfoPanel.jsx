import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Eye, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Gift, 
  ShoppingBag, 
  DollarSign,
  User,
  Award,
  Activity,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerInfoPanel = ({ customer, onClose }) => {
  const [activeTab, setActiveTab] = useState("info");

  // Mock data para el cliente
  const customerData = {
    name: customer?.name || "Ana García",
    phone: customer?.phone || "+34 612 345 678",
    email: customer?.email || "ana.garcia@email.com",
    location: "Madrid, España",
    visits: 12,
    totalSpent: 480,
    avgSpent: 40,
    lastVisit: "Hace 3 días",
    favoriteTable: "Mesa 7 (terraza)",
    allergies: ["Gluten"],
    preferences: ["Vegetariano", "Sin alcohol"],
    orders: [
      { date: "2024-01-15", items: "Ensalada César, Agua", total: 15 },
      { date: "2024-01-10", items: "Pizza Margherita, Cerveza", total: 22 },
      { date: "2024-01-05", items: "Pasta Carbonara, Vino", total: 28 }
    ],
    satisfaction: 4.8,
    sentiment: "positive"
  };

  const TabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Información Personal</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{customerData.name}</div>
                    <div className="text-sm text-gray-600">Cliente habitual</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{customerData.phone}</div>
                    <div className="text-sm text-gray-600">Teléfono principal</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{customerData.email}</div>
                    <div className="text-sm text-gray-600">Email verificado</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{customerData.location}</div>
                    <div className="text-sm text-gray-600">Ubicación</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Estadísticas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{customerData.visits}</div>
                  <div className="text-sm text-blue-600">Visitas</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">€{customerData.totalSpent}</div>
                  <div className="text-sm text-green-600">Total gastado</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">€{customerData.avgSpent}</div>
                  <div className="text-sm text-purple-600">Promedio</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-orange-500 fill-current" />
                    <span className="text-lg font-bold text-orange-600">{customerData.satisfaction}</span>
                  </div>
                  <div className="text-sm text-orange-600">Satisfacción</div>
                </div>
              </div>
            </div>

            {/* Preferencias */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preferencias</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Mesa favorita:</span> {customerData.favoriteTable}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Alergias:</span>
                  <div className="flex gap-1 mt-1">
                    {customerData.allergies.map((allergy, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Preferencias:</span>
                  <div className="flex gap-1 mt-1">
                    {customerData.preferences.map((pref, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "historial":
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Historial de Pedidos</h4>
            <div className="space-y-3">
              {customerData.orders.map((order, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900">{order.date}</div>
                    <div className="text-sm font-bold text-green-600">€{order.total}</div>
                  </div>
                  <div className="text-sm text-gray-600">{order.items}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "insights":
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Insights del Cliente</h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Tendencia de visitas</span>
                </div>
                <div className="text-sm text-blue-700">
                  Aumento del 25% en los últimos 3 meses
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Cliente VIP</span>
                </div>
                <div className="text-sm text-green-700">
                  Top 10% de clientes por valor total
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Patrón de consumo</span>
                </div>
                <div className="text-sm text-purple-700">
                  Prefiere cenas los viernes y sábados
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Información del cliente
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {["info", "historial", "insights"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-1.5 text-sm font-medium rounded transition-colors capitalize
                ${
                  activeTab === tab
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <TabContent />
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => {
            toast.info("Navegando a crear reserva...");
          }}
          className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Crear reserva
        </button>
        <button
          onClick={() => {
            toast.info("Ver perfil completo próximamente");
          }}
          className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Ver perfil completo
        </button>
      </div>
    </div>
  );
};

export default React.memo(CustomerInfoPanel);
