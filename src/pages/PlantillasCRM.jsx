// PlantillasCRM.jsx - PÁGINA DEDICADA PARA PLANTILLAS CRM
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    Mail, Edit2, Save, X, Plus, Copy, Eye, Trash2,
    MessageSquare, Users, Crown, Clock, AlertTriangle,
    RefreshCw, CheckCircle2, Sparkles, Target
} from "lucide-react";
import toast from "react-hot-toast";

// PLANTILLAS ESTÁNDAR POR TIPO DE CLIENTE
const STANDARD_TEMPLATES = {
    nuevo: {
        name: "Bienvenida Cliente Nuevo",
        subject: "¡Bienvenido a {restaurant_name}!",
        content: `¡Hola {customer_name}!

Gracias por visitarnos por primera vez en {restaurant_name}. Esperamos que hayas disfrutado de tu experiencia con nosotros.

Como nuevo cliente, queremos asegurarnos de que tengas la mejor experiencia posible. Si tienes alguna sugerencia o comentario, no dudes en contactarnos.

Estamos aquí para hacer que cada visita sea especial para ti.

¡Esperamos verte pronto de nuevo!

Un saludo cordial,
El equipo de {restaurant_name}`,
        icon: "👋",
        color: "blue"
    },
    alto_valor: {
        name: "Cliente Alto Valor - Agradecimiento",
        subject: "Gracias por ser parte de {restaurant_name}",
        content: `Hola {customer_name},

Queremos agradecerte por ser un cliente activo de {restaurant_name}. Tus visitas regulares significan mucho para nosotros.

Hemos notado que disfrutas de nuestra cocina y ambiente, y eso nos llena de alegría. Seguimos trabajando cada día para ofrecerte la mejor experiencia gastronómica.

Si hay algo específico que te gustaría que mejoráramos o algún plato especial que te gustaría probar, ¡háznoslo saber!

Gracias por confiar en nosotros.

Con aprecio,
El equipo de {restaurant_name}`,
        icon: "⭐",
        color: "green"
    },
    vip: {
        name: "Promoción a Cliente VIP",
        subject: "¡Felicidades! Ahora eres cliente VIP de {restaurant_name}",
        content: `¡Hola {customer_name}!

Nos complace informarte que ahora formas parte de nuestro programa exclusivo VIP (Very Important Person) en {restaurant_name}.

Como cliente VIP, disfrutarás de beneficios especiales:
• Reservas prioritarias
• Mesa preferencial cuando esté disponible
• Atención personalizada de nuestro equipo
• Invitaciones a eventos exclusivos
• Degustaciones especiales de nuevos platos
• Descuentos en ocasiones especiales

Tu fidelidad y confianza son invaluables para nosotros. Gracias por elegir {restaurant_name} como tu lugar especial.

¡Esperamos celebrar contigo muchos momentos más!

Con gratitud,
El equipo de {restaurant_name}`,
        icon: "👑",
        color: "purple"
    },
    noshow: {
        name: "Seguimiento No-Show",
        subject: "Te echamos de menos en {restaurant_name}",
        content: `Hola {customer_name},

Notamos que tenías una reserva con nosotros el {reservation_date} y no pudiste acompañarnos.

Entendemos que a veces surgen imprevistos. No hay problema, estas cosas pasan.

¿Te gustaría hacer una nueva reserva? Estaremos encantados de recibirte cuando te venga bien.

Si hubo algún inconveniente que podamos resolver, por favor háznoslo saber. Tu experiencia es muy importante para nosotros.

¡Esperamos verte pronto!

Un saludo cordial,
El equipo de {restaurant_name}`,
        icon: "⏰",
        color: "red"
    },
    en_riesgo: {
        name: "Cliente En Riesgo - Atención Especial",
        subject: "¿Cómo podemos mejorar tu experiencia en {restaurant_name}?",
        content: `Hola {customer_name},

Hemos notado que ha pasado un tiempo desde tu última visita a {restaurant_name}, y queremos asegurarnos de que todo esté bien.

Tu opinión es muy importante para nosotros. Si hubo algo en tu última experiencia que no cumplió con tus expectativas, nos encantaría saberlo para poder mejorarlo.

Estamos comprometidos a ofrecerte el mejor servicio posible, y tu feedback nos ayuda a lograrlo.

¿Te gustaría que te contactemos para hablar sobre cómo podemos hacer que tu próxima visita sea perfecta?

Valoramos mucho tu confianza.

Atentamente,
El equipo de {restaurant_name}`,
        icon: "⚠️",
        color: "orange"
    },
    inactivo: {
        name: "Reactivación Cliente Inactivo",
        subject: "Te echamos de menos en {restaurant_name}",
        content: `Hola {customer_name},

¡Hace tiempo que no te vemos por {restaurant_name}! Esperamos que estés bien.

Durante tu ausencia, hemos añadido nuevos platos a nuestra carta que creemos te van a encantar. También hemos mejorado nuestra experiencia gastronómica pensando en clientes especiales como tú.

Nos encantaría verte de nuevo y ponerte al día con todas las novedades. ¿Qué te parece si reservas una mesa para esta semana? Te garantizamos una experiencia excepcional.

Tu mesa te está esperando.

¡Esperamos verte pronto!

Con cariño,
El equipo de {restaurant_name}`,
        icon: "😴",
        color: "gray"
    },
    noshow_followup: {
        name: "Clientes No-Show - Seguimiento",
        subject: "Te echamos de menos en {restaurant_name}",
        content: `Hola {customer_name},

Notamos que tenías una reserva con nosotros el {reservation_date} y no pudiste acompañarnos.

Entendemos que a veces surgen imprevistos. No hay problema, estas cosas pasan.

¿Te gustaría hacer una nueva reserva? Estaremos encantados de recibirte cuando te venga bien.

Si hubo algún inconveniente que podamos resolver, por favor háznoslo saber. Tu experiencia es muy importante para nosotros.

¡Esperamos verte pronto!

Un saludo cordial,
El equipo de {restaurant_name}`,
        icon: "⏰",
        color: "red"
    }
};

export default function PlantillasCRM() {
    const { restaurant, restaurantId } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Cargar plantillas desde Supabase
    const loadTemplates = async () => {
        if (!restaurantId) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("message_templates")
                .select("*")
                .eq("restaurant_id", restaurantId)
                .order("segment", { ascending: true })
                .order("priority", { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error("Error cargando plantillas:", error);
            toast.error("Error al cargar las plantillas");
        } finally {
            setLoading(false);
        }
    };

    // Guardar plantilla
    const saveTemplate = async (templateData) => {
        try {
            const { error } = await supabase
                .from("message_templates")
                .update({
                    name: templateData.name,
                    subject: templateData.subject,
                    content_markdown: templateData.content,
                    updated_at: new Date().toISOString()
                })
                .eq("id", templateData.id);

            if (error) throw error;

            toast.success("✅ Plantilla guardada correctamente");
            setShowModal(false);
            setEditingTemplate(null);
            loadTemplates();
        } catch (error) {
            console.error("Error guardando plantilla:", error);
            toast.error("Error al guardar la plantilla");
        }
    };

    // Crear nueva plantilla
    const createTemplate = async (type) => {
        try {
            const standardTemplate = STANDARD_TEMPLATES[type];
            
            const { error } = await supabase
                .from("message_templates")
                .insert({
                    restaurant_id: restaurantId,
                    name: standardTemplate.name,
                    segment: type,
                    subject: standardTemplate.subject,
                    content_markdown: standardTemplate.content,
                    variables: ["restaurant_name", "customer_name"],
                    is_active: true,
                    channel: "email"
                });

            if (error) throw error;

            toast.success("✅ Plantilla creada correctamente");
            loadTemplates();
        } catch (error) {
            console.error("Error creando plantilla:", error);
            toast.error("Error al crear la plantilla");
        }
    };

    // Duplicar plantilla
    const duplicateTemplate = async (template) => {
        try {
            const { error } = await supabase
                .from("message_templates")
                .insert({
                    restaurant_id: restaurantId,
                    name: `${template.name} (Copia)`,
                    segment: template.segment,
                    subject: template.subject,
                    content_markdown: template.content_markdown,
                    variables: template.variables,
                    is_active: true,
                    channel: template.channel || "email"
                });

            if (error) throw error;

            toast.success("✅ Plantilla duplicada correctamente");
            loadTemplates();
        } catch (error) {
            console.error("Error duplicando plantilla:", error);
            toast.error("Error al duplicar la plantilla");
        }
    };

    // Eliminar plantilla
    const deleteTemplate = async (templateId) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) return;

        try {
            const { error } = await supabase
                .from("message_templates")
                .delete()
                .eq("id", templateId);

            if (error) throw error;

            toast.success("✅ Plantilla eliminada correctamente");
            loadTemplates();
        } catch (error) {
            console.error("Error eliminando plantilla:", error);
            toast.error("Error al eliminar la plantilla");
        }
    };

    // Abrir modal de edición
    const openEditModal = (template) => {
        setEditingTemplate({ ...template });
        setPreviewMode(false);
        setShowModal(true);
    };

    // Abrir modal de vista previa
    const openPreviewModal = (template) => {
        setEditingTemplate({ ...template });
        setPreviewMode(true);
        setShowModal(true);
    };

    useEffect(() => {
        loadTemplates();
    }, [restaurantId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando plantillas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Principal */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Mail className="w-8 h-8 text-purple-600 mr-3" />
                                Plantillas CRM
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestiona y personaliza las plantillas de mensajes para cada tipo de cliente
                            </p>
                        </div>
                        <button
                            onClick={loadTemplates}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Plantillas</p>
                                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Activas</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {templates.filter(t => t.is_active ?? t.active).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tipos</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {new Set(templates.map(t => t.segment || t.type)).size}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plantillas por Tipo */}
                <div className="space-y-8">
                    {Object.entries(STANDARD_TEMPLATES).map(([type, standard]) => {
                        const typeTemplates = templates.filter(t => t.segment === type);
                        
                        return (
                            <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className={`px-6 py-4 border-b border-gray-200 bg-${standard.color}-50`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{standard.icon}</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 capitalize">
                                                    Clientes {type}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {typeTemplates.length} plantilla{typeTemplates.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => createTemplate(type)}
                                            className={`flex items-center gap-2 px-3 py-2 bg-${standard.color}-600 text-white rounded-lg hover:bg-${standard.color}-700 transition-colors text-sm`}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Nueva Plantilla
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {typeTemplates.length > 0 ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {typeTemplates.map(template => (
                                                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openPreviewModal(template)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                title="Vista previa"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(template)}
                                                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => duplicateTemplate(template)}
                                                                className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                                                                title="Duplicar"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteTemplate(template.id)}
                                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <strong>Asunto:</strong> {template.subject}
                                                    </p>
                                                    <p className="text-xs text-gray-500 line-clamp-3">
                                                        {(template.content_markdown || template.content || '').substring(0, 150)}...
                                                    </p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                            (template.is_active ?? template.active)
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {(template.is_active ?? template.active) ? 'Activa' : 'Inactiva'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Prioridad {template.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No hay plantillas para este tipo de cliente</p>
                                            <p className="text-xs mt-1">Haz clic en "Nueva Plantilla" para crear una</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal de Edición/Vista Previa */}
                {showModal && editingTemplate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {previewMode ? 'Vista Previa' : 'Editar'} Plantilla
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {previewMode ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre de la Plantilla
                                            </label>
                                            <p className="text-gray-900">{editingTemplate.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Asunto del Mensaje
                                            </label>
                                            <p className="text-gray-900">{editingTemplate.subject}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contenido del Mensaje
                                            </label>
                                            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                                                {editingTemplate.content_markdown || editingTemplate.content}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre de la Plantilla
                                            </label>
                                            <input
                                                type="text"
                                                value={editingTemplate.name}
                                                onChange={(e) => setEditingTemplate(prev => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Asunto del Mensaje
                                            </label>
                                            <input
                                                type="text"
                                                value={editingTemplate.subject}
                                                onChange={(e) => setEditingTemplate(prev => ({
                                                    ...prev,
                                                    subject: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contenido del Mensaje
                                            </label>
                                            <textarea
                                                value={editingTemplate.content_markdown || editingTemplate.content || ''}
                                                onChange={(e) => setEditingTemplate(prev => ({
                                                    ...prev,
                                                    content: e.target.value,
                                                    content_markdown: e.target.value
                                                }))}
                                                rows={12}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">Variables Disponibles:</h4>
                                            <div className="flex flex-wrap gap-2 text-sm">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {"{restaurant_name}"}
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {"{customer_name}"}
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {"{customer_phone}"}
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {"{customer_email}"}
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {"{last_visit_date}"}
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {"{reservation_date}"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-blue-700 mt-2">
                                                💡 Usa estas variables en tus mensajes y se reemplazarán automáticamente con los datos reales del cliente.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    {!previewMode && (
                                        <button
                                            onClick={() => saveTemplate(editingTemplate)}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar Plantilla
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
