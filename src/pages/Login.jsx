// Contenido CORREGIDO para: src/pages/Login.jsx

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [mode, setMode] = useState('login'); // 'login' o 'register'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

    // Estados para login
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    // Estados para registro
    const [registerData, setRegisterData] = useState({
        email: '', password: '', confirmPassword: '', fullName: '', phone: '',
        restaurantName: '', restaurantAddress: '', restaurantPhone: '', restaurantEmail: '', whatsappNumber: '',
        acceptTerms: false
    });

    const { signIn } = useAuthContext();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => password.length >= 6;

    // --- MANEJAR LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!validateEmail(loginData.email) || !validatePassword(loginData.password)) {
            setMessage('Email o contraseña no válidos.');
            setMessageType('error');
            setLoading(false);
            return;
        }

        const { error } = await signIn(loginData.email, loginData.password);
        if (error) {
            setMessage(error.message.includes('Invalid login credentials') ? 'Email o contraseña incorrectos.' : 'Por favor, confirma tu email para poder iniciar sesión.');
            setMessageType('error');
        }
        setLoading(false);
    };

    // --- MANEJAR REGISTRO ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Aquí irían todas las validaciones del formulario de registro...
        if (registerData.password !== registerData.confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            setMessageType('error');
            setLoading(false);
            return;
        }
        // Añadir más validaciones si es necesario...

        try {
            // 1. Crear el usuario en Supabase Auth. Esto es lo primero.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: registerData.email,
                password: registerData.password,
            });

            if (authError) throw authError;

            // 2. Crear el restaurante. COMO EL USUARIO YA ESTÁ AUTENTICADO,
            // NUESTRO TRIGGER EN LA BASE DE DATOS SE ACTIVARÁ AUTOMÁTICAMENTE.
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .insert({
                    name: registerData.restaurantName,
                    email: registerData.restaurantEmail || registerData.email,
                    phone: registerData.restaurantPhone,
                    address: registerData.restaurantAddress,
                    whatsapp_number: registerData.whatsappNumber
                })
                .select()
                .single();

            if (restaurantError) throw restaurantError;

            // 3. NO NECESITAMOS CREAR EL PERFIL MANUALMENTE. ¡EL TRIGGER DE LA DB LO HACE AUTOMÁTICO!
            // Esto hace el código mucho más limpio y seguro.

            // 4. Crear horarios por defecto (usando la tabla 'schedules')
            const defaultHours = [
                { day_of_week: 1, is_open: true, lunch_open: '13:00', lunch_close: '16:00', dinner_open: '20:00', dinner_close: '23:30' },
                { day_of_week: 2, is_open: true, lunch_open: '13:00', lunch_close: '16:00', dinner_open: '20:00', dinner_close: '23:30' },
                { day_of_week: 3, is_open: true, lunch_open: '13:00', lunch_close: '16:00', dinner_open: '20:00', dinner_close: '23:30' },
                { day_of_week: 4, is_open: true, lunch_open: '13:00', lunch_close: '16:00', dinner_open: '20:00', dinner_close: '23:30' },
                { day_of_week: 5, is_open: true, lunch_open: '13:00', lunch_close: '16:30', dinner_open: '20:00', dinner_close: '00:00' },
                { day_of_week: 6, is_open: true, lunch_open: '13:00', lunch_close: '16:30', dinner_open: '20:00', dinner_close: '00:30' },
                { day_of_week: 0, is_open: true, lunch_open: '13:00', lunch_close: '16:30', dinner_open: '20:00', dinner_close: '23:30' },
            ].map(h => ({ ...h, restaurant_id: restaurantData.id }));

            await supabase.from('schedules').insert(defaultHours);

            // TODO: Podrías añadir la creación de mesas por defecto aquí si quieres.

            setMessage('¡Registro exitoso! Revisa tu email para confirmar la cuenta.');
            setMessageType('success');

        } catch (error) {
            setMessage(error.message.includes('User already registered') ? 'Este email ya está en uso.' : 'Error en el registro: ' + error.message);
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    // El resto del código es la parte visual (JSX) y no necesita cambios.
    // Es el mismo que en tu versión "nueva".
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-white text-2xl font-bold">S</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Son-IA</h1>
                    <p className="text-gray-600">Gestión de Reservas con IA</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => { setMode('login'); setMessage(''); }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            onClick={() => { setMode('register'); setMessage(''); }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Registrar Restaurante
                        </button>
                    </div>

                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" placeholder="tu@email.com" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <input type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" placeholder="••••••••" required/>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                    )}

                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="border-b border-gray-200 pb-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Tus datos</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                                        <input type="text" value={registerData.fullName} onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Juan Pérez" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="tu@email.com" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                                        <input type="password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Mínimo 6 caracteres" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
                                        <input type="password" value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Repite la contraseña" required/>
                                    </div>
                                </div>
                            </div>
                            <div className="pb-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Datos del restaurante</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del restaurante *</label>
                                        <input type="text" value={registerData.restaurantName} onChange={(e) => setRegisterData({ ...registerData, restaurantName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Restaurante La Buena Mesa" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del restaurante *</label>
                                        <input type="tel" value={registerData.restaurantPhone} onChange={(e) => setRegisterData({ ...registerData, restaurantPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="+34 91 123 4567" required/>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <input type="checkbox" id="acceptTerms" checked={registerData.acceptTerms} onChange={(e) => setRegisterData({ ...registerData, acceptTerms: e.target.checked })} className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" required/>
                                <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">Acepto los <a href="#" className="text-blue-600 hover:text-blue-500">términos</a> y <a href="#" className="text-blue-600 hover:text-blue-500">política de privacidad</a></label>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all">
                                {loading ? 'Creando cuenta...' : 'Crear Cuenta y Restaurante'}
                            </button>
                        </form>
                    )}

                    {message && (
                        <div className={`mt-4 p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}