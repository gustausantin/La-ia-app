// useChannelStats.js - Hook para obtener estadísticas de canales
import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useChannelStats = () => {
    const { restaurantId } = useAuthContext();
    const [channelStats, setChannelStats] = useState({
        active: 0,
        total: 5,
        validChannels: []
    });
    const [loading, setLoading] = useState(true);

    const loadChannelStats = async () => {
        if (!restaurantId) {
            setChannelStats({ active: 0, total: 5, validChannels: [] });
            setLoading(false);
            return;
        }

        try {
            const { data: restaurant, error } = await supabase
                .from('restaurants')
                .select('settings')
                .eq('id', restaurantId)
                .single();

            if (error) throw error;

            const channels = restaurant?.settings?.channels || {};
            const totalChannels = Object.keys(channels).length || 5;
            
            // Validar cada canal
            const activeChannels = [];
            
            Object.entries(channels).forEach(([channelType, channelSettings]) => {
                if (channelSettings.enabled && isChannelValid(channelType, channelSettings)) {
                    activeChannels.push(channelType);
                }
            });

            setChannelStats({
                active: activeChannels.length,
                total: totalChannels,
                validChannels: activeChannels
            });

        } catch (error) {
            console.error('Error loading channel stats:', error);
            setChannelStats({ active: 0, total: 5, validChannels: [] });
        } finally {
            setLoading(false);
        }
    };

    // Función para validar canales (similar a la de Configuración)
    const isChannelValid = (channelType, channelSettings) => {
        switch (channelType) {
            case 'vapi':
                return channelSettings.api_key?.trim() && channelSettings.phone_number?.trim();
            case 'whatsapp':
                return channelSettings.phone_number?.trim() && channelSettings.api_key?.trim();
            case 'email':
                return channelSettings.smtp_host?.trim() && 
                       channelSettings.smtp_user?.trim() && 
                       channelSettings.smtp_password?.trim() && 
                       channelSettings.from_email?.trim();
            case 'facebook':
                return channelSettings.page_id?.trim() && channelSettings.access_token?.trim();
            case 'instagram':
                return channelSettings.page_id?.trim() && channelSettings.access_token?.trim();
            case 'web_chat':
                return true; // Web chat no requiere credenciales externas
            default:
                return false;
        }
    };

    useEffect(() => {
        loadChannelStats();
    }, [restaurantId]);

    return {
        channelStats,
        loading,
        refresh: loadChannelStats
    };
};
