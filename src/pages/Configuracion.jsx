import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

function Configuracion() {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        smsAlerts: false,
        theme: 'light'
    });

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Configuración guardada correctamente');
        } catch (error) {
            toast.error('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-7 h-7 text-purple-600" />
                    Configuración
                </h1>
                <p className="text-gray-600 mt-1">
                    Personaliza tu experiencia con La-IA
                </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del restaurante
                            </label>
                            <input
                                type="text"
                                defaultValue="Restaurante Tavertet"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Notificaciones push</p>
                                <p className="text-sm text-gray-600">Recibe alertas en tiempo real</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Alertas por email</p>
                                <p className="text-sm text-gray-600">Recibe resúmenes por email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.emailAlerts}
                                    onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Alertas por SMS</p>
                                <p className="text-sm text-gray-600">Recibe alertas urgentes por SMS</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.smsAlerts}
                                    onChange={(e) => setSettings({...settings, smsAlerts: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <p className="font-medium text-gray-900">Cambiar contraseña</p>
                            <p className="text-sm text-gray-600">Actualiza tu contraseña de acceso</p>
                        </button>

                        <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <p className="font-medium text-gray-900">Autenticación de dos factores</p>
                            <p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
                        </button>
                    </div>
                </div>

                {/* Theme Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Palette className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Apariencia</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tema
                            </label>
                            <select
                                value={settings.theme}
                                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="light">Claro</option>
                                <option value="dark">Oscuro</option>
                                <option value="auto">Automático</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Configuracion;