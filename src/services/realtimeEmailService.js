// ========================================
// REALTIME EMAIL SERVICE
// Escucha cambios en reservations y envía emails automáticamente
// ========================================

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Cliente de Supabase con Service Role (bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurar transporter SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'noreply@la-ia.site',
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Formatear fecha en español
const formatDate = (dateString) => {
  try {
    const date = parseISO(dateString);
    return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
  } catch (error) {
    return dateString;
  }
};

// Verificar horario silencioso
const isQuietHours = (quietHours) => {
  if (!quietHours || !quietHours.enabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = (quietHours.start || '23:00').split(':').map(Number);
  const [endHour, endMinute] = (quietHours.end || '09:00').split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }
  
  return currentTime >= startTime && currentTime < endTime;
};

// Template de nueva reserva
const getNewReservationEmailHTML = (variables) => {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.08);overflow:hidden;">
<div style="background-color:#7c3aed;padding:30px 40px;color:#ffffff;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:bold;">🍽️ Nueva Reserva</h1>
<p style="margin:8px 0 0 0;font-size:16px;opacity:0.9;">${variables.RestaurantName}</p>
</div>
<div style="padding:40px;">
<p style="font-size:18px;color:#1a1a1a;margin:0 0 25px 0;">Hola <strong>${variables.ContactName}</strong>,</p>
<p style="font-size:16px;color:#333333;line-height:1.6;margin:0 0 30px 0;">Se ha confirmado una nueva reserva en tu restaurante:</p>
<div style="background-color:#f9fafb;border-left:4px solid #7c3aed;padding:25px;border-radius:8px;margin-bottom:30px;">
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">👤 Cliente</span><span style="color:#111827;font-size:18px;font-weight:600;">${variables.CustomerName}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">📧 Email</span><span style="color:#111827;font-size:16px;">${variables.CustomerEmail}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">📱 Teléfono</span><span style="color:#111827;font-size:16px;">${variables.CustomerPhone}</span></div>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">📅 Fecha</span><span style="color:#111827;font-size:18px;font-weight:600;">${variables.ReservationDate}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">🕐 Hora</span><span style="color:#111827;font-size:18px;font-weight:600;">${variables.ReservationTime}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">👥 Comensales</span><span style="color:#111827;font-size:18px;font-weight:600;">${variables.PartySize} personas</span></div>
${variables.SpecialRequests ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"><div><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">💬 Peticiones especiales</span><span style="color:#111827;font-size:16px;font-style:italic;">${variables.SpecialRequests}</span></div>` : ''}
</div>
<div style="text-align:center;margin:35px 0;">
<a href="${variables.AppURL}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Ver detalles en la app</a>
</div>
</div>
<div style="background-color:#f9fafb;padding:30px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:14px;color:#6b7280;text-align:center;">Enviado por <strong style="color:#7c3aed;">La-IA</strong> - Sistema de reservas inteligente</p>
</div>
</div>
</body>
</html>`;
};

// Template de reserva cancelada
const getCancelledReservationEmailHTML = (variables) => {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.08);overflow:hidden;">
<div style="background-color:#ef4444;padding:30px 40px;color:#ffffff;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:bold;">❌ Reserva Cancelada</h1>
<p style="margin:8px 0 0 0;font-size:16px;opacity:0.9;">${variables.RestaurantName}</p>
</div>
<div style="padding:40px;">
<p style="font-size:18px;color:#1a1a1a;margin:0 0 25px 0;">Hola <strong>${variables.ContactName}</strong>,</p>
<p style="font-size:16px;color:#333333;line-height:1.6;margin:0 0 30px 0;">Se ha <strong style="color:#ef4444;">cancelado una reserva</strong> en tu restaurante:</p>
<div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:25px;border-radius:8px;margin-bottom:30px;">
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">👤 Cliente</span><span style="color:#111827;font-size:18px;font-weight:600;">${variables.CustomerName}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">📅 Fecha</span><span style="color:#111827;font-size:18px;font-weight:600;text-decoration:line-through;opacity:0.6;">${variables.ReservationDate}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">🕐 Hora</span><span style="color:#111827;font-size:18px;font-weight:600;text-decoration:line-through;opacity:0.6;">${variables.ReservationTime}</span></div>
<div style="margin-bottom:15px;"><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">👥 Comensales</span><span style="color:#111827;font-size:18px;font-weight:600;text-decoration:line-through;opacity:0.6;">${variables.PartySize} personas</span></div>
${variables.CancellationReason ? `<hr style="border:none;border-top:1px solid #fee2e2;margin:20px 0;"><div><span style="color:#6b7280;font-size:14px;display:block;margin-bottom:4px;">📝 Motivo</span><span style="color:#991b1b;font-size:16px;font-style:italic;">${variables.CancellationReason}</span></div>` : ''}
</div>
<div style="text-align:center;margin:35px 0;">
<a href="${variables.AppURL}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">Ver en la app</a>
</div>
</div>
<div style="background-color:#f9fafb;padding:30px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:14px;color:#6b7280;text-align:center;">Enviado por <strong style="color:#7c3aed;">La-IA</strong></p>
</div>
</div>
</body>
</html>`;
};

// Enviar email de nueva reserva
export const sendNewReservationEmail = async (reservation, restaurant) => {
  try {
    console.log('📧 Enviando email de nueva reserva:', reservation.id);
    
    const settings = restaurant.settings || {};
    const notificationSettings = settings.notifications || {};
    const reservationNotif = notificationSettings.new_reservation || {};
    
    // Verificar si está habilitado
    if (reservationNotif.enabled === false) {
      console.log('⏭️ Notificaciones de nueva reserva deshabilitadas');
      return { success: true, skipped: true, reason: 'disabled' };
    }
    
    // Verificar horario silencioso
    if (isQuietHours(notificationSettings.quiet_hours)) {
      console.log('🔕 Horario silencioso activo');
      return { success: true, skipped: true, reason: 'quiet_hours' };
    }
    
    // Obtener emails destino
    const notificationEmails = settings.notification_emails || [restaurant.email];
    
    if (!notificationEmails || notificationEmails.length === 0) {
      console.warn('⚠️ No hay emails configurados');
      return { success: false, error: 'No notification emails' };
    }
    
    // Preparar variables
    const variables = {
      RestaurantName: restaurant.name,
      ContactName: settings.contact_name || 'Equipo',
      CustomerName: reservation.customer_name,
      CustomerEmail: reservation.customer_email,
      CustomerPhone: reservation.customer_phone || 'No proporcionado',
      ReservationDate: formatDate(reservation.reservation_date),
      ReservationTime: reservation.reservation_time,
      PartySize: reservation.party_size,
      SpecialRequests: reservation.special_requests || '',
      AppURL: `https://la-ia-app.vercel.app/reservas?id=${reservation.id}`,
    };
    
    // Generar HTML
    const html = getNewReservationEmailHTML(variables);
    
    // Enviar
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `La-IA - ${restaurant.name} <noreply@la-ia.site>`,
      replyTo: restaurant.email,
      to: notificationEmails,
      subject: `🍽️ Nueva reserva - ${reservation.customer_name}`,
      html,
    });
    
    console.log('✅ Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

// Enviar email de reserva cancelada
export const sendCancelledReservationEmail = async (reservation, restaurant) => {
  try {
    console.log('📧 Enviando email de cancelación:', reservation.id);
    
    const settings = restaurant.settings || {};
    const notificationSettings = settings.notifications || {};
    const cancelledNotif = notificationSettings.cancelled_reservation || {};
    
    if (cancelledNotif.enabled === false) {
      console.log('⏭️ Notificaciones de cancelación deshabilitadas');
      return { success: true, skipped: true, reason: 'disabled' };
    }
    
    if (isQuietHours(notificationSettings.quiet_hours)) {
      console.log('🔕 Horario silencioso activo');
      return { success: true, skipped: true, reason: 'quiet_hours' };
    }
    
    const notificationEmails = settings.notification_emails || [restaurant.email];
    
    if (!notificationEmails || notificationEmails.length === 0) {
      console.warn('⚠️ No hay emails configurados');
      return { success: false, error: 'No notification emails' };
    }
    
    const variables = {
      RestaurantName: restaurant.name,
      ContactName: settings.contact_name || 'Equipo',
      CustomerName: reservation.customer_name,
      CustomerEmail: reservation.customer_email,
      CustomerPhone: reservation.customer_phone || 'No proporcionado',
      ReservationDate: formatDate(reservation.reservation_date),
      ReservationTime: reservation.reservation_time,
      PartySize: reservation.party_size,
      CancellationReason: reservation.cancellation_reason || '',
      AppURL: `https://la-ia-app.vercel.app/reservas?id=${reservation.id}`,
    };
    
    const html = getCancelledReservationEmailHTML(variables);
    
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `La-IA - ${restaurant.name} <noreply@la-ia.site>`,
      replyTo: restaurant.email,
      to: notificationEmails,
      subject: `❌ Reserva cancelada - ${reservation.customer_name}`,
      html,
    });
    
    console.log('✅ Email de cancelación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email de cancelación:', error);
    return { success: false, error: error.message };
  }
};

// Iniciar listener de Realtime
export const startRealtimeEmailListener = () => {
  console.log('🎧 Iniciando listener de notificaciones por email...');
  
  const channel = supabase
    .channel('reservation-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reservations',
      },
      async (payload) => {
        console.log('🆕 Nueva reserva detectada:', payload.new.id);
        
        try {
          // Obtener datos completos del restaurante
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', payload.new.restaurant_id)
            .single();
          
          if (restaurant) {
            await sendNewReservationEmail(payload.new, restaurant);
          }
        } catch (error) {
          console.error('Error procesando nueva reserva:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'reservations',
        filter: 'status=eq.cancelled',
      },
      async (payload) => {
        // Solo enviar si cambió a cancelled
        if (payload.old.status !== 'cancelled' && payload.new.status === 'cancelled') {
          console.log('❌ Reserva cancelada detectada:', payload.new.id);
          
          try {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('*')
              .eq('id', payload.new.restaurant_id)
              .single();
            
            if (restaurant) {
              await sendCancelledReservationEmail(payload.new, restaurant);
            }
          } catch (error) {
            console.error('Error procesando cancelación:', error);
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Listener de notificaciones activo');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en canal de Realtime');
      }
    });
  
  return channel;
};

