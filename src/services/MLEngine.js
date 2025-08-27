/**
 * 🤖 MACHINE LEARNING ENGINE PARA LA-IA
 * Sistema de aprendizaje automático avanzado para restaurantes
 */

import { log } from '../utils/logger.js';

// Simulación de algoritmos ML avanzados
class MLEngine {
  constructor() {
    this.models = {
      customerSegmentation: new CustomerSegmentationModel(),
      demandPrediction: new DemandPredictionModel(),
      tableOptimization: new TableOptimizationModel(),
      priceOptimization: new PriceOptimizationModel(),
      churnPrediction: new ChurnPredictionModel()
    };
    
    this.trainingData = new Map();
    this.modelPerformance = new Map();
    this.isTraining = false;
  }

  // === SEGMENTACIÓN INTELIGENTE DE CLIENTES ===
  async segmentCustomers(customers) {
    try {
      log.info('🧠 Starting ML customer segmentation...');
      
      const segments = await this.models.customerSegmentation.predict(customers);
      
      // Aplicar algoritmos avanzados
      const enrichedSegments = customers.map(customer => {
        const baseSegment = this.calculateBaseSegment(customer);
        const behaviorScore = this.calculateBehaviorScore(customer);
        const valueScore = this.calculateValueScore(customer);
        const churnRisk = this.calculateChurnRisk(customer);
        
        // Algoritmo de segmentación multidimensional
        const segment = this.determineAdvancedSegment({
          baseSegment,
          behaviorScore,
          valueScore,
          churnRisk,
          visitFrequency: customer.visit_frequency || 0,
          avgSpending: customer.avg_spending || 0,
          lastVisit: customer.last_visit,
          preferences: customer.preferences || []
        });

        return {
          ...customer,
          ai_segment: segment.name,
          confidence_score: segment.confidence,
          behavior_score: behaviorScore,
          value_score: valueScore,
          churn_risk: churnRisk,
          predicted_ltv: this.calculateLTV(customer),
          next_visit_probability: this.calculateNextVisitProbability(customer),
          recommended_actions: segment.actions
        };
      });

      log.info('✅ Customer segmentation completed:', enrichedSegments.length);
      return enrichedSegments;

    } catch (error) {
      log.error('❌ Customer segmentation failed:', error);
      throw error;
    }
  }

  // === PREDICCIÓN DE DEMANDA AVANZADA ===
  async predictDemand(dateRange, factors = {}) {
    try {
      log.info('📈 Predicting demand with ML algorithms...');
      
      const {
        weather = 'normal',
        events = [],
        seasonality = true,
        promotions = [],
        historicalData = []
      } = factors;

      // Algoritmo de predicción multifactorial
      const baseDemand = await this.calculateBaseDemand(historicalData);
      const seasonalityAdjustment = this.calculateSeasonalityImpact(dateRange);
      const weatherImpact = this.calculateWeatherImpact(weather);
      const eventsImpact = this.calculateEventsImpact(events);
      const promotionsImpact = this.calculatePromotionsImpact(promotions);
      
      // Neural network simulation para predicción avanzada
      const prediction = this.neuralNetworkPredict({
        baseDemand,
        seasonalityAdjustment,
        weatherImpact,
        eventsImpact,
        promotionsImpact,
        dayOfWeek: new Date(dateRange.start).getDay(),
        month: new Date(dateRange.start).getMonth(),
        isHoliday: this.isHoliday(dateRange.start)
      });

      const demandPrediction = {
        expectedReservations: Math.round(prediction.reservations),
        confidence: prediction.confidence,
        timeSlots: this.predictTimeSlotDemand(prediction),
        recommendations: this.generateDemandRecommendations(prediction),
        factors: {
          weather: weatherImpact,
          events: eventsImpact,
          seasonality: seasonalityAdjustment,
          promotions: promotionsImpact
        }
      };

      log.info('✅ Demand prediction completed:', demandPrediction);
      return demandPrediction;

    } catch (error) {
      log.error('❌ Demand prediction failed:', error);
      throw error;
    }
  }

  // === OPTIMIZACIÓN AUTOMÁTICA DE MESAS ===
  async optimizeTables(reservations, tableLayout, constraints = {}) {
    try {
      log.info('🪑 Starting intelligent table optimization...');
      
      const {
        maxWaitTime = 15,
        preferredUtilization = 0.85,
        partyTypePreferences = {},
        vipPriority = true
      } = constraints;

      // Algoritmo genético para optimización de mesas
      const optimization = await this.geneticAlgorithmOptimization({
        reservations,
        tables: tableLayout,
        objectives: {
          minimizeWaitTime: 0.4,
          maximizeRevenue: 0.35,
          maximizeCustomerSatisfaction: 0.25
        },
        constraints: {
          maxWaitTime,
          preferredUtilization,
          vipPriority
        }
      });

      const optimizedLayout = {
        assignments: optimization.tableAssignments,
        efficiency: optimization.efficiency,
        expectedRevenue: optimization.revenue,
        customerSatisfaction: optimization.satisfaction,
        recommendations: [
          ...this.generateLayoutRecommendations(optimization),
          ...this.generateTimingRecommendations(optimization),
          ...this.generateStaffingRecommendations(optimization)
        ]
      };

      log.info('✅ Table optimization completed:', optimizedLayout.efficiency);
      return optimizedLayout;

    } catch (error) {
      log.error('❌ Table optimization failed:', error);
      throw error;
    }
  }

  // === INSIGHTS AUTOMÁTICOS CON NLP ===
  async generateAutoInsights(data) {
    try {
      log.info('💡 Generating automatic insights with NLP...');
      
      const insights = [];
      
      // Análisis de tendencias con NLP
      const trendAnalysis = await this.analyzeTrends(data);
      const anomalyDetection = await this.detectAnomalies(data);
      const patternRecognition = await this.recognizePatterns(data);
      const competitiveAnalysis = await this.simulateCompetitiveAnalysis(data);

      // Generar insights narrativos con NLP
      for (const trend of trendAnalysis) {
        const insight = await this.generateNarrativeInsight(trend, 'trend');
        insights.push(insight);
      }

      for (const anomaly of anomalyDetection) {
        const insight = await this.generateNarrativeInsight(anomaly, 'anomaly');
        insights.push(insight);
      }

      for (const pattern of patternRecognition) {
        const insight = await this.generateNarrativeInsight(pattern, 'pattern');
        insights.push(insight);
      }

      // Priorizar insights por impacto
      const prioritizedInsights = this.prioritizeInsights(insights);
      
      log.info('✅ Auto insights generated:', prioritizedInsights.length);
      return prioritizedInsights;

    } catch (error) {
      log.error('❌ Auto insights generation failed:', error);
      throw error;
    }
  }

  // === ALGORITMOS DE SOPORTE ===
  
  calculateBaseSegment(customer) {
    const visitFreq = customer.total_reservations || 0;
    const avgSpend = customer.avg_spending || 0;
    const recency = this.daysSinceLastVisit(customer.last_visit);

    if (visitFreq >= 20 && avgSpend >= 100) return 'VIP';
    if (visitFreq >= 10 && avgSpend >= 50) return 'Frequent';
    if (recency <= 30) return 'Active';
    if (recency <= 90) return 'Regular';
    return 'New';
  }

  calculateBehaviorScore(customer) {
    // Algoritmo de scoring comportamental
    let score = 0;
    
    // Frecuencia de visitas (40%)
    const visitFreq = customer.total_reservations || 0;
    score += Math.min(visitFreq / 10, 1) * 40;
    
    // Puntualidad (20%)
    const punctuality = customer.punctuality_score || 0.8;
    score += punctuality * 20;
    
    // Engagement (20%)
    const engagement = this.calculateEngagement(customer);
    score += engagement * 20;
    
    // Lealtad (20%)
    const loyalty = this.calculateLoyalty(customer);
    score += loyalty * 20;
    
    return Math.round(score);
  }

  calculateValueScore(customer) {
    // Algoritmo de valor del cliente
    const avgSpend = customer.avg_spending || 0;
    const frequency = customer.total_reservations || 0;
    const recency = this.daysSinceLastVisit(customer.last_visit);
    
    // RFM scoring
    const recencyScore = Math.max(0, 100 - recency);
    const frequencyScore = Math.min(frequency * 5, 100);
    const monetaryScore = Math.min(avgSpend / 2, 100);
    
    return Math.round((recencyScore + frequencyScore + monetaryScore) / 3);
  }

  calculateChurnRisk(customer) {
    // Algoritmo de predicción de abandono
    const daysSince = this.daysSinceLastVisit(customer.last_visit);
    const avgInterval = customer.avg_visit_interval || 30;
    const frequencyTrend = customer.frequency_trend || 0;
    
    let risk = 0;
    
    // Recencia (50%)
    if (daysSince > avgInterval * 2) risk += 50;
    else if (daysSince > avgInterval * 1.5) risk += 30;
    else if (daysSince > avgInterval) risk += 15;
    
    // Tendencia de frecuencia (30%)
    if (frequencyTrend < -0.5) risk += 30;
    else if (frequencyTrend < 0) risk += 15;
    
    // Engagement reciente (20%)
    const recentEngagement = customer.recent_engagement || 0.5;
    risk += (1 - recentEngagement) * 20;
    
    return Math.min(Math.round(risk), 100);
  }

  calculateLTV(customer) {
    // Predicción de valor de vida del cliente
    const avgSpend = customer.avg_spending || 0;
    const frequency = customer.total_reservations || 0;
    const lifespan = customer.customer_lifespan || 365; // días
    
    // Modelo LTV básico
    const annualVisits = (frequency / lifespan) * 365;
    const annualValue = annualVisits * avgSpend;
    const predictedLifespan = this.predictCustomerLifespan(customer);
    
    return Math.round(annualValue * (predictedLifespan / 365));
  }

  neuralNetworkPredict(inputs) {
    // Simulación de red neuronal para predicción
    const weights = {
      baseDemand: 0.3,
      seasonality: 0.2,
      weather: 0.15,
      events: 0.2,
      promotions: 0.1,
      dayOfWeek: 0.05
    };
    
    let prediction = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (inputs[key] !== undefined) {
        prediction += inputs[key] * weight;
      }
    });
    
    // Aplicar función de activación (sigmoid)
    const normalizedPrediction = 1 / (1 + Math.exp(-prediction));
    
    return {
      reservations: normalizedPrediction * 100, // Escalar a número realista
      confidence: Math.min(0.95, 0.6 + normalizedPrediction * 0.35)
    };
  }

  async generateNarrativeInsight(data, type) {
    // Generación de insights narrativos con NLP simulado
    const templates = {
      trend: [
        `Se detectó una tendencia ${data.direction} del ${data.percentage}% en ${data.metric} durante ${data.period}.`,
        `${data.metric} ha mostrado un ${data.direction === 'up' ? 'crecimiento' : 'descenso'} sostenido de ${data.percentage}%.`,
        `Los datos indican una ${data.direction === 'up' ? 'mejora' : 'disminución'} significativa en ${data.metric}.`
      ],
      anomaly: [
        `Se detectó una anomalía en ${data.metric}: ${data.description}.`,
        `Comportamiento inusual identificado: ${data.metric} está ${data.deviation} del promedio esperado.`,
        `Alerta: ${data.metric} presenta valores ${data.deviation > 0 ? 'superiores' : 'inferiores'} a lo normal.`
      ],
      pattern: [
        `Patrón identificado: ${data.description} ocurre consistentemente ${data.frequency}.`,
        `Se observa un patrón recurrente en ${data.metric} relacionado con ${data.factor}.`,
        `Los datos revelan una correlación entre ${data.factor1} y ${data.factor2}.`
      ]
    };
    
    const template = templates[type][Math.floor(Math.random() * templates[type].length)];
    
    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: this.generateInsightTitle(data, type),
      description: template,
      confidence: data.confidence || Math.random() * 0.4 + 0.6,
      impact: data.impact || Math.random() * 0.5 + 0.5,
      actionable: data.actionable !== false,
      recommendations: this.generateInsightRecommendations(data, type),
      timestamp: new Date().toISOString()
    };
  }

  // === MÉTODOS AUXILIARES ===
  
  daysSinceLastVisit(lastVisit) {
    if (!lastVisit) return 999;
    return Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
  }

  isHoliday(date) {
    // Simplificado - en producción usar API de holidays
    const holidays = ['2024-12-25', '2024-01-01', '2024-07-04'];
    return holidays.includes(date);
  }

  generateInsightTitle(data, type) {
    const titles = {
      trend: `Tendencia en ${data.metric}`,
      anomaly: `Anomalía detectada en ${data.metric}`,
      pattern: `Patrón identificado: ${data.description}`
    };
    return titles[type] || 'Insight generado por IA';
  }

  generateInsightRecommendations(data, type) {
    // Generar recomendaciones basadas en insights
    const recommendations = [];
    
    if (type === 'trend' && data.direction === 'down') {
      recommendations.push('Considerar promociones para revertir la tendencia');
      recommendations.push('Analizar factores que pueden estar causando la disminución');
    }
    
    if (type === 'anomaly') {
      recommendations.push('Investigar las causas de la anomalía');
      recommendations.push('Monitorear de cerca la métrica en los próximos días');
    }
    
    if (type === 'pattern') {
      recommendations.push('Aprovechar este patrón para optimizar operaciones');
      recommendations.push('Crear estrategias basadas en el patrón identificado');
    }
    
    return recommendations;
  }
}

// === MODELOS ESPECIALIZADOS ===

class CustomerSegmentationModel {
  async predict(customers) {
    // Simulación de modelo de segmentación
    return customers.map(customer => ({
      ...customer,
      predicted_segment: this.classifyCustomer(customer)
    }));
  }
  
  classifyCustomer(customer) {
    // Lógica de clasificación simplificada
    const score = (customer.total_reservations || 0) * (customer.avg_spending || 0);
    if (score > 1000) return 'VIP';
    if (score > 500) return 'Frequent';
    if (score > 100) return 'Regular';
    return 'New';
  }
}

class DemandPredictionModel {
  async predict(historicalData, factors) {
    // Simulación de modelo de predicción de demanda
    const baseDemand = historicalData.reduce((sum, d) => sum + d.reservations, 0) / historicalData.length;
    const adjustment = this.calculateFactorAdjustment(factors);
    return baseDemand * adjustment;
  }
  
  calculateFactorAdjustment(factors) {
    let adjustment = 1.0;
    if (factors.weather === 'good') adjustment *= 1.2;
    if (factors.weather === 'bad') adjustment *= 0.8;
    if (factors.events?.length > 0) adjustment *= 1.3;
    return adjustment;
  }
}

class TableOptimizationModel {
  async optimize(reservations, tables) {
    // Algoritmo de optimización de mesas
    return this.greedyOptimization(reservations, tables);
  }
  
  greedyOptimization(reservations, tables) {
    // Algoritmo greedy simplificado
    const assignments = new Map();
    const sortedReservations = reservations.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    sortedReservations.forEach(reservation => {
      const bestTable = this.findBestTable(reservation, tables, assignments);
      if (bestTable) {
        assignments.set(reservation.id, bestTable.id);
      }
    });
    
    return {
      assignments: Array.from(assignments.entries()),
      efficiency: this.calculateEfficiency(assignments, reservations, tables)
    };
  }
  
  findBestTable(reservation, tables, currentAssignments) {
    return tables.find(table => 
      table.capacity >= reservation.party_size && 
      !this.isTableOccupied(table.id, reservation.time, currentAssignments)
    );
  }
  
  isTableOccupied(tableId, time, assignments) {
    // Verificar si la mesa está ocupada en ese horario
    return false; // Simplificado
  }
  
  calculateEfficiency(assignments, reservations, tables) {
    return Math.min(0.95, assignments.size / reservations.length);
  }
}

class PriceOptimizationModel {
  async optimizePrices(demandPrediction, currentPrices, constraints) {
    // Optimización dinámica de precios
    return currentPrices; // Placeholder
  }
}

class ChurnPredictionModel {
  async predictChurn(customers) {
    // Predicción de abandono de clientes
    return customers.map(customer => ({
      ...customer,
      churn_probability: Math.random() * 0.5 // Simplificado
    }));
  }

  // === MÉTODOS AUXILIARES FALTANTES ===

  calculateEngagement(customer) {
    // Calcular engagement basado en frecuencia y recencia
    const visits = customer.visits || 0;
    const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : new Date();
    const daysSinceLastVisit = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    
    // Score de engagement (0-1)
    const frequencyScore = Math.min(visits / 10, 1); // Normalizar a 10 visitas = 1.0
    const recencyScore = Math.max(0, 1 - daysSinceLastVisit / 365); // Decae en un año
    
    return (frequencyScore + recencyScore) / 2;
  }

  async calculateBaseDemand(historicalData) {
    // Calcular demanda base usando promedio móvil
    if (!historicalData || historicalData.length === 0) {
      return { average: 50, trend: 'stable', confidence: 0.5 };
    }
    
    const demands = historicalData.map(d => d.demand || d.reservations || 0);
    const average = demands.reduce((a, b) => a + b, 0) / demands.length;
    
    // Calcular tendencia
    const recentData = demands.slice(-7); // Últimos 7 días
    const olderData = demands.slice(-14, -7); // 7 días anteriores
    const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
    const olderAvg = olderData.reduce((a, b) => a + b, 0) / olderData.length;
    
    const trend = recentAvg > olderAvg * 1.1 ? 'growing' : 
                  recentAvg < olderAvg * 0.9 ? 'declining' : 'stable';
    
    return { 
      average, 
      trend, 
      confidence: Math.min(historicalData.length / 30, 1) // Más datos = más confianza
    };
  }

  async geneticAlgorithmOptimization(params) {
    const { reservations, tables, preferences } = params;
    
    // Simulación de algoritmo genético simplificado
    const solutions = [];
    
    for (let generation = 0; generation < 10; generation++) {
      const solution = {
        assignment: this.createRandomAssignment(reservations, tables),
        fitness: this.calculateFitness(reservations, tables, preferences)
      };
      solutions.push(solution);
    }
    
    // Retornar la mejor solución
    const bestSolution = solutions.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
    
    return {
      optimalAssignment: bestSolution.assignment,
      efficiency: bestSolution.fitness,
      improvementPercentage: Math.min(bestSolution.fitness * 100, 100),
      alternatives: solutions.slice(0, 3).map(s => s.assignment)
    };
  }

  createRandomAssignment(reservations, tables) {
    // Crear asignación aleatoria para algoritmo genético
    const assignment = {};
    
    reservations.forEach((reservation, index) => {
      const availableTables = tables.filter(t => t.capacity >= reservation.party_size);
      if (availableTables.length > 0) {
        const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];
        assignment[reservation.id] = randomTable.id;
      }
    });
    
    return assignment;
  }

  calculateFitness(reservations, tables, preferences) {
    // Calcular fitness de una solución
    let score = 0;
    
    // Factores de fitness
    const utilizationBonus = 0.4; // 40% por utilización
    const preferenceBonus = 0.3;  // 30% por preferencias
    const efficiencyBonus = 0.3;  // 30% por eficiencia
    
    // Calcular utilización
    const usedTables = new Set();
    reservations.forEach(r => {
      if (r.assignedTable) usedTables.add(r.assignedTable);
    });
    
    const utilization = usedTables.size / tables.length;
    score += utilization * utilizationBonus;
    
    return Math.min(score + Math.random() * 0.5, 1); // Añadir algo de aleatoriedad
  }

  async analyzeTrends(data) {
    // Análisis de tendencias con NLP simulado
    const trends = {
      revenue: { direction: 'up', magnitude: 0.15, confidence: 0.8 },
      customer_satisfaction: { direction: 'stable', magnitude: 0.02, confidence: 0.9 },
      peak_hours: { shift: '+1h', reason: 'seasonal', confidence: 0.7 },
      popular_dishes: ['Paella', 'Gazpacho', 'Tapas'], 
      declining_items: ['Ensalada César'],
      seasonal_patterns: {
        spring: 'Incremento en reservas de terraza',
        summer: 'Mayor demanda de bebidas frías',
        autumn: 'Preferencia por platos calientes',
        winter: 'Aumento en celebraciones'
      }
    };
    
    return trends;
  }

  async detectAnomalies(data) {
    // Detección de anomalías usando desviación estándar
    const values = data.map(d => d.value || d.revenue || Math.random() * 100);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
    
    const anomalies = values
      .map((value, index) => ({
        index,
        value,
        isAnomaly: Math.abs(value - mean) > 2 * stdDev,
        severity: Math.abs(value - mean) / stdDev
      }))
      .filter(item => item.isAnomaly);
    
    return {
      detected: anomalies.length,
      anomalies,
      threshold: 2 * stdDev,
      summary: `Se detectaron ${anomalies.length} anomalías significativas`
    };
  }

  async recognizePatterns(data) {
    // Reconocimiento de patrones temporales
    return {
      weekly: {
        peak_days: ['viernes', 'sábado'],
        low_days: ['lunes', 'martes'],
        pattern_strength: 0.85
      },
      monthly: {
        peak_weeks: [2, 3], // Segunda y tercera semana
        seasonal_factor: 1.2,
        pattern_strength: 0.7
      },
      yearly: {
        high_seasons: ['primavera', 'verano'],
        low_seasons: ['invierno'],
        growth_rate: 0.08
      },
      behavioral: {
        repeat_customers: 0.65,
        booking_advance: '3.5 días promedio',
        cancellation_rate: 0.12
      }
    };
  }

  // === MÉTODOS FALTANTES CRÍTICOS ===

  calculateSeasonalityImpact(dateRange) {
    // Calcular impacto estacional
    const month = new Date(dateRange.start).getMonth();
    const seasonFactors = {
      // Invierno: 0,1,2,11
      0: 0.8, 1: 0.9, 2: 1.0, 11: 0.85,
      // Primavera: 3,4,5  
      3: 1.1, 4: 1.2, 5: 1.3,
      // Verano: 6,7,8
      6: 1.4, 7: 1.5, 8: 1.3,
      // Otoño: 9,10
      9: 1.1, 10: 1.0
    };
    return seasonFactors[month] || 1.0;
  }

  calculateWeatherImpact(weather) {
    // Calcular impacto del clima
    const weatherFactors = {
      'excellent': 1.3, 'good': 1.1, 'normal': 1.0,
      'cloudy': 0.95, 'rainy': 0.8, 'stormy': 0.6,
      'very_cold': 0.75, 'very_hot': 0.85
    };
    return weatherFactors[weather] || 1.0;
  }

  calculateEventsImpact(events) {
    if (!events || events.length === 0) return 1.0;
    let impact = 1.0;
    events.forEach(event => {
      switch(event.type) {
        case 'concert': impact += 0.4; break;
        case 'festival': impact += 0.6; break;
        case 'sports': impact += 0.3; break;
        case 'holiday': impact += 0.5; break;
        default: impact += 0.1;
      }
    });
    return Math.min(impact, 2.0);
  }

  calculatePromotionsImpact(promotions) {
    if (!promotions || promotions.length === 0) return 1.0;
    let impact = 1.0;
    promotions.forEach(promo => {
      switch(promo.type) {
        case 'discount': impact += promo.value * 0.01; break;
        case 'happy_hour': impact += 0.3; break;
        case 'menu_special': impact += 0.15; break;
        default: impact += 0.05;
      }
    });
    return Math.min(impact, 1.8);
  }

  predictTimeSlotDemand(prediction) {
    const totalDemand = prediction.reservations || 50;
    const timeSlots = [];
    const hourlyDistribution = {
      '12:00': 0.15, '13:00': 0.25, '14:00': 0.20, '15:00': 0.10,
      '19:00': 0.05, '20:00': 0.15, '21:00': 0.25, '22:00': 0.20, '23:00': 0.10
    };
    
    Object.entries(hourlyDistribution).forEach(([hour, percentage]) => {
      timeSlots.push({
        time: hour,
        expectedReservations: Math.round(totalDemand * percentage),
        confidence: prediction.confidence * (0.8 + Math.random() * 0.2)
      });
    });
    return timeSlots;
  }

  generateDemandRecommendations(prediction) {
    const recommendations = [];
    const demand = prediction.reservations || 50;
    
    if (demand > 80) {
      recommendations.push({
        type: 'staffing', message: 'Aumentar personal para alta demanda', priority: 'high'
      });
    } else if (demand < 30) {
      recommendations.push({
        type: 'promotion', message: 'Activar promociones', priority: 'high'
      });
    }
    return recommendations;
  }

  predictCustomerLifespan(customer) {
    const visits = customer.total_reservations || 0;
    const engagementScore = this.calculateEngagement(customer);
    let lifespan = 365; // Base 1 año
    lifespan *= (1 + engagementScore);
    if (visits > 10) lifespan *= 1.5;
    return Math.min(lifespan, 365 * 5); // Max 5 años
  }

  calculateLoyalty(customer) {
    const visits = customer.total_reservations || 0;
    const months = customer.months_active || 1;
    const consistencyScore = Math.min(visits / months, 1);
    return consistencyScore;
  }

  generateLayoutRecommendations(optimization) {
    return ['Optimizar disposición de mesas según demanda'];
  }

  generateTimingRecommendations(optimization) {
    return ['Ajustar horarios de apertura según patrones'];
  }

  generateStaffingRecommendations(optimization) {
    return ['Programar personal adicional en horas pico'];
  }

  prioritizeInsights(insights) {
    return insights.sort((a, b) => (b.impact * b.confidence) - (a.impact * a.confidence));
  }

  determineAdvancedSegment(params) {
    const { baseSegment, behaviorScore, valueScore, churnRisk } = params;
    let confidence = 0.8;
    
    if (behaviorScore > 80 && valueScore > 80) {
      return { name: 'Champion', confidence, actions: ['Programa VIP', 'Ofertas exclusivas'] };
    }
    if (valueScore > 70 && churnRisk < 30) {
      return { name: 'Loyal Customer', confidence, actions: ['Programa lealtad', 'Comunicación personalizada'] };
    }
    if (churnRisk > 70) {
      return { name: 'At Risk', confidence, actions: ['Campaña retención', 'Oferta especial'] };
    }
    
    return { name: baseSegment, confidence: 0.6, actions: ['Seguimiento estándar'] };
  }

  calculateNextVisitProbability(customer) {
    const daysSince = this.daysSinceLastVisit(customer.last_visit);
    const avgInterval = customer.avg_visit_interval || 30;
    return Math.max(0, 1 - (daysSince / (avgInterval * 2)));
  }

  async simulateCompetitiveAnalysis(data) {
    return {
      market_position: 'strong',
      competitive_advantages: ['Servicio personalizado', 'Ubicación privilegiada'],
      opportunities: ['Expansión digital', 'Nuevos segmentos']
    };
  }
}

// Instancia singleton
export const mlEngine = new MLEngine();
export default MLEngine;
