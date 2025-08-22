import React, { useMemo } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Zap,
  Activity,
  Users,
  Clock,
  Star,
  ArrowRight,
  Bot,
  BarChart3,
} from 'lucide-react';

const AIInsights = React.memo(({ data, dateRange }) => {
  // Generar insights inteligentes con memoización
  const insights = useMemo(() => {
    // En producción, estos insights vendrían del backend/IA
    return {
      // Insights principales
      mainInsights: [
        {
          id: 'peak_hours',
          type: 'opportunity',
          icon: Clock,
          title: 'Horario de Mayor Demanda',
          description: 'Las consultas aumentan 45% entre 19:00-21:00. Considera promociones en este horario.',
          impact: 'high',
          metric: '+45% consultas',
          action: 'Crear promoción horario peak',
          confidence: 92,
        },
        {
          id: 'conversion_drop',
          type: 'alert',
          icon: TrendingUp,
          title: 'Caída en Conversión WhatsApp',
          description: 'La tasa de conversión en WhatsApp bajó 8% esta semana. Revisar respuestas automáticas.',
          impact: 'medium',
          metric: '-8% conversión',
          action: 'Optimizar respuestas IA',
          confidence: 87,
        },
        {
          id: 'satisfaction_high',
          type: 'success',
          icon: Star,
          title: 'Satisfacción Récord',
          description: 'La satisfacción del cliente alcanzó 4.7/5, el máximo en 6 meses.',
          impact: 'high',
          metric: '4.7/5 ⭐',
          action: 'Mantener estrategia actual',
          confidence: 95,
        },
        {
          id: 'ai_efficiency',
          type: 'success',
          icon: Bot,
          title: 'IA Superando Objetivos',
          description: 'El agente IA resuelve 94% de consultas sin intervención humana.',
          impact: 'high',
          metric: '94% autonomía',
          action: 'Expandir capacidades IA',
          confidence: 98,
        },
      ],

      // Recomendaciones predictivas
      predictions: [
        {
          id: 'weekend_surge',
          title: 'Incremento Fin de Semana',
          description: 'Se prevé un aumento del 35% en reservas este fin de semana basado en patrones históricos.',
          probability: 87,
          impact: '+35% reservas',
          timeframe: 'Este fin de semana',
        },
        {
          id: 'table_preference',
          title: 'Preferencia por Terraza',
          description: 'El 68% de clientes prefiere mesas en terraza. Optimizar disponibilidad.',
          probability: 91,
          impact: '+12% satisfacción',
          timeframe: 'Inmediato',
        },
        {
          id: 'repeat_customers',
          title: 'Clientes Recurrentes',
          description: 'Identificados 23 clientes con alta probabilidad de repetir en los próximos 7 días.',
          probability: 78,
          impact: '€1,840 ingresos',
          timeframe: 'Próximos 7 días',
        },
      ],

      // Métricas de la IA
      aiMetrics: {
        totalInteractions: 1247,
        successfulResolutions: 1173,
        humanHandoffs: 74,
        averageResponseTime: 1.2,
        accuracyRate: 94.2,
        learningProgress: 8.5,
        customerSatisfaction: 4.7,
        costSavings: 2340,
      },

      // Patrones identificados
      patterns: [
        {
          id: 'booking_pattern',
          title: 'Patrón de Reservas',
          description: 'Los martes tienen 23% menos reservas. Oportunidad para promociones especiales.',
          category: 'Temporal',
          strength: 'Alto',
        },
        {
          id: 'customer_journey',
          title: 'Jornada del Cliente',
          description: 'Clientes que preguntan por menú tienen 67% más probabilidad de reservar.',
          category: 'Comportamiento',
          strength: 'Muy Alto',
        },
        {
          id: 'seasonal_trend',
          title: 'Tendencia Estacional',
          description: 'Enero muestra incremento del 15% vs diciembre en reservas de cenas.',
          category: 'Estacional',
          strength: 'Medio',
        },
      ],
    };
  }, [data, dateRange]);

  // Componente de insight individual
  const InsightCard = ({ insight }) => {
    const getTypeConfig = (type) => {
      switch (type) {
        case 'opportunity':
          return {
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-600',
            badgeColor: 'bg-blue-100 text-blue-800',
          };
        case 'alert':
          return {
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            iconColor: 'text-orange-600',
            badgeColor: 'bg-orange-100 text-orange-800',
          };
        case 'success':
          return {
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            iconColor: 'text-green-600',
            badgeColor: 'bg-green-100 text-green-800',
          };
        default:
          return {
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            iconColor: 'text-gray-600',
            badgeColor: 'bg-gray-100 text-gray-800',
          };
      }
    };

    const config = getTypeConfig(insight.type);
    const Icon = insight.icon;

    return (
      <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-white ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-700">{insight.description}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.badgeColor}`}>
            {insight.confidence}% confianza
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-900">{insight.metric}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              insight.impact === 'high' ? 'bg-red-100 text-red-800' :
              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {insight.impact === 'high' ? 'Alto impacto' : 
               insight.impact === 'medium' ? 'Impacto medio' : 'Bajo impacto'}
            </span>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            {insight.action}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Componente de predicción
  const PredictionCard = ({ prediction }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{prediction.title}</h4>
        <span className="text-sm font-medium text-purple-600">{prediction.probability}%</span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{prediction.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{prediction.timeframe}</span>
        <span className="font-medium text-green-600">{prediction.impact}</span>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${prediction.probability}%` }}
        />
      </div>
    </div>
  );

  // Componente de patrón
  const PatternCard = ({ pattern }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{pattern.title}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          pattern.strength === 'Muy Alto' ? 'bg-green-100 text-green-800' :
          pattern.strength === 'Alto' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {pattern.strength}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
      <span className="text-xs text-gray-500">{pattern.category}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con métricas de IA */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Insights de Inteligencia Artificial</h2>
              <p className="text-purple-100">Análisis inteligente y recomendaciones</p>
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-yellow-300" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{insights.aiMetrics.successfulResolutions}</div>
            <div className="text-sm text-purple-100">Resoluciones Exitosas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{insights.aiMetrics.accuracyRate}%</div>
            <div className="text-sm text-purple-100">Precisión</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{insights.aiMetrics.averageResponseTime}min</div>
            <div className="text-sm text-purple-100">Tiempo Respuesta</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">€{insights.aiMetrics.costSavings}</div>
            <div className="text-sm text-purple-100">Ahorro Mensual</div>
          </div>
        </div>
      </div>

      {/* Insights principales */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Insights Principales
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.mainInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Predicciones */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          Predicciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.predictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </div>

      {/* Patrones identificados */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Patrones Identificados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.patterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </div>

      {/* Progreso del aprendizaje de la IA */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Progreso del Aprendizaje IA
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Comprensión del lenguaje natural</span>
              <span className="font-medium">96%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Gestión de reservas</span>
              <span className="font-medium">94%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Recomendaciones personalizadas</span>
              <span className="font-medium">88%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '88%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Gestión de conflictos</span>
              <span className="font-medium">82%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          El agente IA continúa aprendiendo de cada interacción. Progreso general: +{insights.aiMetrics.learningProgress}% este mes.
        </p>
      </div>
    </div>
  );
});

AIInsights.displayName = 'AIInsights';

export default AIInsights;
