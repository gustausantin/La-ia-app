import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, CheckCircle, Shield, Calendar, X } from 'lucide-react';

/**
 * Modal Unificado para Confirmar Acciones de Disponibilidades
 * Usado para: Borrar, Regenerar, etc.
 */
const ConfirmActionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    type = 'delete', // 'delete' | 'regenerate'
    stats = {}
}) => {
    if (!isOpen) return null;

    const config = {
        delete: {
            icon: Trash2,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            title: '🗑️ Borrar Disponibilidades',
            description: 'Se eliminarán los horarios disponibles sin reservas',
            actionButton: 'Borrar Disponibilidades',
            actionButtonClass: 'bg-red-600 hover:bg-red-700',
            sections: [
                {
                    icon: CheckCircle,
                    iconColor: 'text-green-600',
                    title: 'ACCIÓN:',
                    items: [
                        'Eliminará horarios disponibles (sin reservas)',
                        'Mantendrá horarios ocupados (con reservas)',
                        'Resultado: Solo quedarán todas las reservas (cualquier status)'
                    ]
                },
                {
                    icon: Shield,
                    iconColor: 'text-blue-600',
                    title: 'PROTECCIÓN TOTAL DE RESERVAS:',
                    items: [
                        'Los días con reservas (cualquier status) NO se tocarán',
                        'Los horarios ocupados permanecerán intactos',
                        'Todas las reservas están 100% protegidas'
                    ]
                }
            ]
        },
        regenerate: {
            icon: Calendar,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-100',
            title: '🔄 Regenerar Disponibilidades',
            description: 'Se actualizarán los horarios según tu configuración',
            actionButton: 'Regenerar Ahora',
            actionButtonClass: 'bg-green-600 hover:bg-green-700',
            sections: [
                {
                    icon: CheckCircle,
                    iconColor: 'text-green-600',
                    title: 'SE VA A HACER:',
                    items: [
                        'Eliminará horarios viejos disponibles',
                        'Creará nuevos horarios según tu configuración',
                        'Resultado: Disponibilidades actualizadas'
                    ]
                },
                {
                    icon: Shield,
                    iconColor: 'text-blue-600',
                    title: 'DÍAS PROTEGIDOS:',
                    items: [
                        'Los días con reservas (cualquier status) NO se modificarán',
                        'Todas las reservas están 100% protegidas',
                        'Solo se actualizan días sin reservas'
                    ]
                }
            ]
        }
    };

    const currentConfig = config[type];
    const Icon = currentConfig.icon;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${currentConfig.iconBg}`}>
                                    <Icon className={`w-6 h-6 ${currentConfig.iconColor}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {currentConfig.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {currentConfig.description}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {currentConfig.sections.map((section, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                                    <h4 className="font-semibold text-gray-900">
                                        {section.title}
                                    </h4>
                                </div>
                                <ul className="space-y-2">
                                    {section.items.map((item, itemIdx) => (
                                        <li key={itemIdx} className="flex items-start space-x-2">
                                            <span className="text-gray-400 mt-1">•</span>
                                            <span className="text-sm text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {/* Info adicional - ADVERTENCIA SERIA */}
                        <div className={`${type === 'delete' ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'} border-2 rounded-lg p-4`}>
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className={`w-6 h-6 ${type === 'delete' ? 'text-red-600' : 'text-orange-600'} mt-0.5 animate-pulse`} />
                                <div>
                                    <p className={`text-sm font-bold ${type === 'delete' ? 'text-red-900' : 'text-orange-900'} mb-2`}>
                                        ⚠️ ADVERTENCIA IMPORTANTE:
                                    </p>
                                    <p className={`text-sm font-medium ${type === 'delete' ? 'text-red-800' : 'text-orange-800'}`}>
                                        {type === 'delete' 
                                            ? '🚨 Esta acción es IRREVERSIBLE. Las disponibilidades borradas NO se pueden recuperar. Asegúrate de que realmente quieres eliminar los horarios antes de continuar.'
                                            : '⚠️ Se eliminarán horarios existentes y se crearán nuevos. Los días con reservas NO se modificarán, pero el resto de horarios se actualizarán según tu configuración actual.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-sm"
                        >
                            ✕ Cancelar
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-8 py-3 text-white rounded-lg transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 ${currentConfig.actionButtonClass} ${type === 'delete' ? 'animate-pulse' : ''}`}
                        >
                            {type === 'delete' ? '🗑️ ' : '🔄 '}{currentConfig.actionButton}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConfirmActionModal;

