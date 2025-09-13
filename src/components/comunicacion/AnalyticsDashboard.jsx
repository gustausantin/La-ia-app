import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  MessageSquare,
  Users,
  Clock,
  Star,
  Bot,
  UserCheck,
  Activity,
  Target,
  Award,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';

const AnalyticsDashboard = React.memo(({ conversations = [], messages = [] }) => {
  // Colores para gráficos
  const CHART_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  // Calcular datos de analytics con memoización
  const analyticsData = useMemo(() => {
    // Datos de ejemplo mejorados - en producción vendrían de la base de datos
    const conversationsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      conversations: Math.floor(Math.random() * 10) + 1,
      ai_handled: Math.floor(Math.random() * 8) + 1,
    }));

    const responseTimeData = Array.from({ length: 7 }, (_, day) => ({
      day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][day],
      ai_response: Math.random() * 2 + 0.5,
      human_response: Math.random() * 10 + 5,
    }));

    const channelDistribution = [
      { name: 'WhatsApp', count: 45, percentage: 45 },
      { name: 'Teléfono', count: 25, percentage: 25 },
      { name: 'Email', count: 20, percentage: 20 },
      { name: 'Web', count: 10, percentage: 10 },
    ];

    const satisfactionTrend = Array.from({ length: 30 }, (_, day) => ({
      day: day + 1,
      satisfaction: 3.5 + Math.random() * 1.5,
      volume: Math.floor(Math.random() * 50) + 10,
    }));

    const aiMetrics = {
      automation_rate: 78,
      resolution_rate: 85,
      handoff_rate: 15,
      accuracy: 92,
    };

    return {
      conversationsByHour,
      responseTimeData,
      channelDistribution,
      satisfactionTrend,
      aiMetrics,
    };
  }, [conversations, messages]);

  // Componente de métrica
  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'transform rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="font-medium text-gray-700">{title}</p>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );

  // Componente de gráfico con header
  const ChartCard = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analytics de Comunicación
        </h2>
        <p className="text-gray-600">
          Métricas detalladas del rendimiento de tu centro de comunicación
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={MessageSquare}
          title="Conversaciones"
          value="1,247"
          subtitle="Este mes"
          trend={12}
          color="blue"
        />
        <MetricCard
          icon={Clock}
          title="Tiempo de Respuesta"
          value="1.2min"
          subtitle="Promedio"
          trend={-8}
          color="green"
        />
        <MetricCard
          icon={Bot}
          title="Automatización IA"
          value={`${analyticsData.aiMetrics.automation_rate}%`}
          subtitle="Conversaciones automatizadas"
          trend={5}
          color="purple"
        />
        <MetricCard
          icon={Star}
          title="Satisfacción"
          value="4.6/5"
          subtitle="Promedio del cliente"
          trend={3}
          color="yellow"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversaciones por hora */}
        <ChartCard
          title="Conversaciones por Hora"
          subtitle="Distribución diaria de la actividad"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.conversationsByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversations" fill="#8B5CF6" name="Total" />
                <Bar dataKey="ai_handled" fill="#10B981" name="IA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Tiempo de respuesta */}
        <ChartCard
          title="Tiempo de Respuesta"
          subtitle="Comparación IA vs Humano por día"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toFixed(1)}min`, '']} />
                <Line
                  type="monotone"
                  dataKey="ai_response"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="IA"
                />
                <Line
                  type="monotone"
                  dataKey="human_response"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Humano"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por canal */}
        <ChartCard
          title="Distribución por Canal"
          subtitle="Volumen de conversaciones por plataforma"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {analyticsData.channelDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Tendencia de satisfacción */}
        <ChartCard
          title="Tendencia de Satisfacción"
          subtitle="Evolución de la satisfacción del cliente"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.satisfactionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[1, 5]} />
                <Tooltip formatter={(value) => [`${value.toFixed(1)}/5`, 'Satisfacción']} />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Métricas de IA */}
      <ChartCard
        title="Métricas de Inteligencia Artificial"
        subtitle="Rendimiento del agente IA"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#8B5CF6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${analyticsData.aiMetrics.automation_rate * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {analyticsData.aiMetrics.automation_rate}%
                </span>
              </div>
            </div>
            <p className="font-medium text-gray-900">Automatización</p>
            <p className="text-sm text-gray-600">Conversaciones automatizadas</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#10B981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${analyticsData.aiMetrics.resolution_rate * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {analyticsData.aiMetrics.resolution_rate}%
                </span>
              </div>
            </div>
            <p className="font-medium text-gray-900">Resolución</p>
            <p className="text-sm text-gray-600">Casos resueltos por IA</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${analyticsData.aiMetrics.handoff_rate * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {analyticsData.aiMetrics.handoff_rate}%
                </span>
              </div>
            </div>
            <p className="font-medium text-gray-900">Transferencia</p>
            <p className="text-sm text-gray-600">Requieren humano</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#3B82F6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${analyticsData.aiMetrics.accuracy * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {analyticsData.aiMetrics.accuracy}%
                </span>
              </div>
            </div>
            <p className="font-medium text-gray-900">Precisión</p>
            <p className="text-sm text-gray-600">Respuestas precisas</p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
