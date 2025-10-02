# 📊 ESQUEMA COMPLETO BASE DE DATOS SUPABASE - LA-IA

> **Fecha:** 2 de Octubre 2025  
> **Fuente:** Export directo desde Supabase `information_schema.columns`  
> **Estado:** ✅ COMPLETO Y VALIDADO

---

## 📋 ÍNDICE DE TABLAS (61 Tablas)

1. [agent_conversations](#agent_conversations)
2. [agent_insights](#agent_insights)
3. [agent_messages](#agent_messages)
4. [agent_metrics](#agent_metrics)
5. [ai_conversation_insights](#ai_conversation_insights)
6. [analytics](#analytics)
7. [analytics_historical](#analytics_historical)
8. [automation_rule_executions](#automation_rule_executions)
9. [automation_rules](#automation_rules)
10. [availability_change_log](#availability_change_log)
11. [availability_slots](#availability_slots)
12. [billing_tickets](#billing_tickets)
13. [channel_credentials](#channel_credentials)
14. [channel_performance](#channel_performance)
15. [conversation_analytics](#conversation_analytics)
16. [crm_settings](#crm_settings)
17. [crm_suggestions](#crm_suggestions)
18. [crm_templates](#crm_templates)
19. [crm_v2_dashboard](#crm_v2_dashboard)
20. [customer_feedback](#customer_feedback)
21. [customer_interactions](#customer_interactions)
22. [customers](#customers)
23. [daily_metrics](#daily_metrics)
24. [interaction_logs](#interaction_logs)
25. [inventory](#inventory)
26. [inventory_items](#inventory_items)
27. [menu_items](#menu_items)
28. [message_templates](#message_templates)
29. [noshow_actions](#noshow_actions)
30. [notifications](#notifications)
31. [profiles](#profiles)
32. [reservations](#reservations)
33. [reservations_with_customer](#reservations_with_customer) (VIEW)
34. [restaurant_business_config](#restaurant_business_config)
35. [restaurant_operating_hours](#restaurant_operating_hours)
36. [restaurant_settings](#restaurant_settings)
37. [restaurant_shifts](#restaurant_shifts)
38. [restaurants](#restaurants)
39. [scheduled_messages](#scheduled_messages)
40. [special_events](#special_events)
41. [staff](#staff)
42. [tables](#tables)
43. [template_variables](#template_variables)
44. [user_restaurant_mapping](#user_restaurant_mapping)
45. [whatsapp_message_buffer](#whatsapp_message_buffer)

---

## 🎯 TABLAS CLAVE PARA N8N AI AGENT

### 1️⃣ **agent_conversations** {#agent_conversations}

**Propósito:** Almacena cada conversación del agente AI con clientes.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK a restaurants |
| `customer_id` | uuid | YES | - | FK a customers (nullable) |
| `customer_phone` | varchar | NO | - | Teléfono del cliente |
| `customer_name` | varchar | YES | - | Nombre del cliente |
| `customer_email` | varchar | YES | - | Email del cliente |
| `source_channel` | varchar | NO | - | **Canal:** whatsapp, vapi, instagram, etc. |
| `interaction_type` | varchar | NO | - | **Tipo:** nueva_reserva, consulta, etc. |
| `status` | varchar | NO | `'active'` | Estado: active, resolved, abandoned |
| `outcome` | varchar | YES | - | Resultado final |
| `reservation_id` | uuid | YES | - | FK a reservations (si aplica) |
| `created_at` | timestamptz | NO | `now()` | Fecha creación |
| `resolved_at` | timestamptz | YES | - | Fecha resolución |
| `resolution_time_seconds` | integer | YES | - | Tiempo de resolución |
| `sentiment` | varchar | YES | - | Sentimiento: positive, neutral, negative |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Datos adicionales |

---

### 2️⃣ **agent_messages** {#agent_messages}

**Propósito:** Mensajes individuales dentro de cada conversación.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `conversation_id` | uuid | NO | - | FK a agent_conversations |
| `restaurant_id` | uuid | NO | - | FK a restaurants |
| `direction` | varchar | NO | - | **inbound** o **outbound** |
| `sender` | varchar | NO | - | **customer** o **agent** |
| `message_text` | text | NO | - | Texto del mensaje |
| `timestamp` | timestamptz | NO | `now()` | Fecha/hora del mensaje |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Metadata adicional |
| `tokens_used` | integer | YES | - | Tokens consumidos (OpenAI) |
| `confidence_score` | numeric | YES | - | Score de confianza (0-1) |

---

### 3️⃣ **customers** {#customers}

**Propósito:** Base de datos de clientes del restaurante.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK a restaurants |
| `name` | varchar | NO | - | Nombre completo |
| `email` | varchar | YES | - | Email |
| `phone` | varchar | YES | - | Teléfono |
| `first_name` | varchar | YES | - | Nombre |
| `last_name1` | varchar | YES | - | Primer apellido |
| `last_name2` | varchar | YES | - | Segundo apellido |
| `preferences` | jsonb | YES | `'{}'::jsonb` | Preferencias |
| `tags` | text[] | YES | - | Etiquetas |
| `notes` | text | YES | - | Notas internas |
| `total_visits` | integer | YES | `0` | Visitas totales |
| `total_spent` | numeric | YES | `0` | Gasto total |
| `last_visit` | timestamptz | YES | - | Última visita |
| `segment_manual` | varchar | YES | - | Segmento manual |
| `segment_auto` | varchar | YES | `'nuevo'` | Segmento automático |
| `segment_auto_v2` | varchar | YES | `'nuevo'` | Segmento v2 |
| `visits_count` | integer | YES | `0` | Contador visitas |
| `last_visit_at` | timestamptz | YES | - | Última visita |
| `avg_ticket` | numeric | YES | `0.00` | Ticket promedio |
| `preferred_items` | jsonb | YES | `'[]'::jsonb` | Items preferidos |
| `consent_email` | boolean | YES | `true` | Consentimiento email |
| `consent_sms` | boolean | YES | `true` | Consentimiento SMS |
| `consent_whatsapp` | boolean | YES | `false` | Consentimiento WhatsApp |
| `last_contacted_at` | timestamptz | YES | - | Último contacto |
| `last_interaction_at` | timestamptz | YES | - | Última interacción |
| `interaction_count` | integer | YES | `0` | Contador interacciones |
| `next_action_at` | timestamptz | YES | - | Próxima acción |
| `churn_risk_score` | integer | YES | `0` | Score riesgo abandono |
| `predicted_ltv` | numeric | YES | `0.00` | LTV predicho |
| `notifications_enabled` | boolean | YES | `true` | Notificaciones activas |
| `preferred_channel` | text | YES | `'whatsapp'` | Canal preferido |
| `aivi_days` | numeric | YES | `30.0` | AIVI (días entre visitas) |
| `recency_days` | integer | YES | `0` | Días desde última visita |
| `visits_12m` | integer | YES | `0` | Visitas últimos 12m |
| `total_spent_12m` | numeric | YES | `0` | Gasto últimos 12m |
| `top_dishes` | jsonb | YES | `'[]'::jsonb` | Platos favoritos |
| `top_categories` | jsonb | YES | `'[]'::jsonb` | Categorías favoritas |
| `fav_weekday` | integer | YES | `6` | Día semana favorito (0-6) |
| `fav_hour_block` | integer | YES | `20` | Hora favorita (0-23) |
| `is_vip_calculated` | boolean | YES | `false` | Es VIP (calculado) |
| `features_updated_at` | timestamptz | YES | `now()` | Última actualización features |
| `birthday` | date | YES | - | Fecha cumpleaños |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | Fecha creación |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` | Fecha actualización |

---

### 4️⃣ **reservations** {#reservations}

**Propósito:** Reservas de mesas.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK a restaurants |
| `customer_id` | uuid | YES | - | FK a customers |
| `customer_name` | varchar | NO | - | Nombre cliente |
| `customer_email` | varchar | YES | - | Email cliente |
| `customer_phone` | varchar | YES | - | Teléfono cliente |
| `reservation_date` | date | NO | - | Fecha reserva |
| `reservation_time` | time | NO | - | Hora reserva |
| `date` | date | YES | - | (duplicado?) |
| `time` | time | YES | - | (duplicado?) |
| `party_size` | integer | NO | - | Número de personas |
| `status` | varchar | YES | `'confirmed'` | confirmed, cancelled, completed, no_show |
| `table_id` | uuid | YES | - | FK a tables |
| `table_number` | varchar | YES | - | Número de mesa (legacy) |
| `special_requests` | text | YES | - | Solicitudes especiales |
| `source` | varchar | YES | `'web'` | Fuente (legacy) |
| `channel` | varchar | YES | `'web'` | Canal de reserva |
| `reservation_source` | varchar | YES | `'manual'` | Fuente de reserva |
| `reservation_channel` | varchar | YES | `'web'` | Canal de reserva |
| `notes` | text | YES | - | Notas internas |
| `spend_amount` | numeric | YES | `0.00` | Monto gastado |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | Fecha creación |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` | Fecha actualización |

---

### 5️⃣ **tables** {#tables}

**Propósito:** Mesas del restaurante.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK a restaurants |
| `table_number` | text | NO | - | Número de mesa |
| `name` | varchar | YES | - | Nombre de la mesa |
| `capacity` | integer | NO | - | Capacidad (personas) |
| `location` | text | YES | - | Ubicación |
| `zone` | varchar | YES | `'main'` | Zona |
| `status` | text | YES | `'available'` | available, occupied, reserved |
| `position_x` | float8 | YES | - | Posición X (plano) |
| `position_y` | float8 | YES | - | Posición Y (plano) |
| `notes` | text | YES | - | Notas |
| `is_active` | boolean | YES | `true` | Activa |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | Fecha creación |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` | Fecha actualización |

---

### 6️⃣ **restaurants** {#restaurants}

**Propósito:** Restaurantes (multi-tenant).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `owner_id` | uuid | YES | - | FK a profiles |
| `name` | varchar | NO | - | Nombre restaurante |
| `email` | varchar | YES | - | Email |
| `phone` | varchar | YES | - | Teléfono |
| `address` | text | YES | - | Dirección |
| `city` | varchar | YES | - | Ciudad |
| `country` | varchar | YES | `'España'` | País |
| `postal_code` | varchar | YES | - | Código postal |
| `cuisine_type` | varchar | YES | - | Tipo cocina |
| `plan` | varchar | YES | `'trial'` | Plan: trial, basic, premium |
| `active` | boolean | YES | `true` | Activo |
| `settings` | jsonb | YES | `'{}'::jsonb` | Configuración general |
| `agent_config` | jsonb | YES | `'{}'::jsonb` | **Config AI Agent** |
| `business_hours` | jsonb | YES | `'{}'::jsonb` | Horarios |
| `crm_config` | jsonb | YES | `'{}'::jsonb` | Config CRM |
| `channels` | jsonb | YES | `'{}'::jsonb` | Canales activos |
| `notifications` | jsonb | YES | `'{}'::jsonb` | Config notificaciones |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | Fecha creación |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` | Fecha actualización |

---

### 7️⃣ **whatsapp_message_buffer** {#whatsapp_message_buffer}

**Propósito:** Buffer temporal para mensajes fragmentados de WhatsApp.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `buffer_key` | varchar | NO | - | Clave única (phone+timestamp) |
| `customer_phone` | varchar | NO | - | Teléfono cliente |
| `customer_name` | varchar | YES | - | Nombre cliente |
| `messages` | text | NO | `''` | Mensajes concatenados |
| `message_count` | integer | YES | `1` | Contador mensajes |
| `last_message_at` | timestamptz | NO | `now()` | Último mensaje recibido |
| `created_at` | timestamptz | YES | `now()` | Fecha creación buffer |

---

### 8️⃣ **availability_slots** {#availability_slots}

**Propósito:** Slots de disponibilidad generados automáticamente.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK a restaurants |
| `slot_date` | date | NO | - | Fecha del slot |
| `start_time` | time | NO | - | Hora inicio |
| `end_time` | time | NO | - | Hora fin |
| `table_id` | uuid | NO | - | FK a tables |
| `shift_name` | text | YES | - | Nombre turno |
| `status` | text | NO | `'free'` | free, reserved, blocked |
| `source` | text | YES | `'system'` | system, manual |
| `is_available` | boolean | YES | `true` | Disponible |
| `duration_minutes` | integer | YES | `90` | Duración en minutos |
| `metadata` | jsonb | YES | `'{}'::jsonb` | Metadata |
| `created_at` | timestamptz | YES | `now()` | Fecha creación |
| `updated_at` | timestamptz | YES | `now()` | Fecha actualización |

---

## 🔧 TABLAS DE CONFIGURACIÓN

### 9️⃣ **restaurant_shifts** {#restaurant_shifts}

**Propósito:** Turnos configurados por restaurante.

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `day_of_week` | integer | NO | - |
| `name` | varchar | NO | - |
| `start_time` | time | NO | - |
| `end_time` | time | NO | - |
| `is_active` | boolean | YES | `true` |
| `created_at` | timestamptz | YES | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

---

### 🔟 **restaurant_operating_hours** {#restaurant_operating_hours}

**Propósito:** Horarios operativos por día de la semana.

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `day_of_week` | integer | NO | - |
| `is_open` | boolean | NO | `true` |
| `open_time` | time | NO | `'09:00:00'` |
| `close_time` | time | NO | `'22:00:00'` |
| `created_at` | timestamptz | YES | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

---

### 1️⃣1️⃣ **channel_credentials** {#channel_credentials}

**Propósito:** Credenciales de canales (WhatsApp, Instagram, etc.).

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `channel` | text | NO | - |
| `is_active` | boolean | YES | `false` |
| `credentials` | jsonb | NO | `'{}'::jsonb` |
| `config` | jsonb | YES | `'{}'::jsonb` |
| `last_test_at` | timestamptz | YES | - |
| `last_test_success` | boolean | YES | - |
| `last_test_error` | text | YES | - |
| `created_at` | timestamptz | YES | `timezone('utc', now())` |
| `updated_at` | timestamptz | YES | `timezone('utc', now())` |

---

## 📊 TABLAS DE MÉTRICAS Y ANALYTICS

### 1️⃣2️⃣ **agent_metrics** {#agent_metrics}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | YES | - |
| `date` | date | YES | `CURRENT_DATE` |
| `total_conversations` | integer | YES | `0` |
| `successful_bookings` | integer | YES | `0` |
| `avg_response_time` | float8 | YES | `0` |
| `conversion_rate` | float8 | YES | `0` |
| `customer_satisfaction` | float8 | YES | `0` |
| `channel_breakdown` | jsonb | YES | `'{}'::jsonb` |
| `created_at` | timestamptz | YES | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

---

### 1️⃣3️⃣ **agent_insights** {#agent_insights}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | YES | - |
| `type` | varchar | YES | - |
| `title` | varchar | YES | - |
| `description` | text | YES | - |
| `priority` | varchar | YES | `'medium'` |
| `action_required` | boolean | YES | `false` |
| `data` | jsonb | YES | `'{}'::jsonb` |
| `created_at` | timestamptz | YES | `now()` |
| `resolved_at` | timestamptz | YES | - |

---

### 1️⃣4️⃣ **channel_performance** {#channel_performance}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | YES | - |
| `channel` | varchar | YES | - |
| `date` | date | YES | `CURRENT_DATE` |
| `conversations` | integer | YES | `0` |
| `bookings` | integer | YES | `0` |
| `conversion_rate` | float8 | YES | `0` |
| `avg_response_time` | float8 | YES | `0` |
| `customer_satisfaction` | float8 | YES | `0` |
| `created_at` | timestamptz | YES | `now()` |

---

## 🤖 TABLAS CRM Y AUTOMATIZACIÓN

### 1️⃣5️⃣ **automation_rules** {#automation_rules}

**Propósito:** Reglas de automatización CRM.

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `name` | varchar | NO | - |
| `description` | text | YES | - |
| `is_active` | boolean | YES | `true` |
| `rule_type` | varchar | YES | - |
| `trigger_event` | text | NO | `'manual'` |
| `trigger_condition` | jsonb | NO | `'{}'::jsonb` |
| `trigger_conditions_v2` | jsonb | YES | `'{}'::jsonb` |
| `action_type` | varchar | YES | - |
| `action_config` | jsonb | NO | `'{}'::jsonb` |
| `target_segment` | text | YES | - |
| `template_id` | uuid | YES | - |
| `cooldown_days` | integer | YES | `30` |
| `max_executions_per_customer` | integer | YES | `3` |
| `max_daily_executions` | integer | YES | `50` |
| `execution_window_days` | integer | YES | `90` |
| `execution_hours_start` | time | YES | `'09:00:00'` |
| `execution_hours_end` | time | YES | `'21:00:00'` |
| `execution_days_of_week` | integer[] | YES | `ARRAY[1,2,3,4,5,6,7]` |
| `aivi_config` | jsonb | YES | `'{}'::jsonb` |
| `execution_stats` | jsonb | YES | `'{}'::jsonb` |
| `created_by` | uuid | YES | - |
| `last_executed_at` | timestamptz | YES | - |
| `last_optimization_at` | timestamptz | YES | - |
| `total_executions` | integer | YES | `0` |
| `successful_executions` | integer | YES | `0` |
| `created_at` | timestamptz | YES | `timezone('utc', now())` |
| `updated_at` | timestamptz | YES | `timezone('utc', now())` |

---

### 1️⃣6️⃣ **message_templates** {#message_templates}

**Propósito:** Plantillas de mensajes para CRM y automatización.

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `name` | text | NO | - |
| `category` | text | NO | - |
| `subject` | text | YES | - |
| `template_type` | varchar | YES | - |
| `body_markdown` | text | YES | - |
| `content_markdown` | text | NO | `''` |
| `preview_text` | text | YES | - |
| `variables` | text[] | YES | `ARRAY[]::text[]` |
| `variables_available` | jsonb | YES | `'[]'::jsonb` |
| `channel` | text | NO | - |
| `segment` | text | NO | `'all'` |
| `segment_target_v2` | varchar | YES | `'all'` |
| `event_trigger` | text | NO | `'manual'` |
| `provider_template_name` | text | YES | - |
| `send_delay_hours` | integer | YES | `0` |
| `optimal_send_time` | varchar | YES | `'any'` |
| `priority` | integer | YES | `5` |
| `is_active` | boolean | YES | `true` |
| `usage_count` | integer | YES | `0` |
| `tags` | text[] | YES | `ARRAY[]::text[]` |
| `personalization_level` | varchar | YES | `'basic'` |
| `success_rate` | numeric | YES | `0.00` |
| `conversion_rate` | numeric | YES | `0.00` |
| `success_metrics` | jsonb | YES | `'{}'::jsonb` |
| `last_used_at` | timestamptz | YES | - |
| `created_by` | uuid | YES | - |
| `created_at` | timestamptz | NO | `timezone('utc', now())` |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` |

---

### 1️⃣7️⃣ **customer_interactions** {#customer_interactions}

**Propósito:** Log de interacciones enviadas a clientes.

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `customer_id` | uuid | NO | - |
| `channel` | varchar | NO | - |
| `template_id` | uuid | YES | - |
| `interaction_type` | varchar | NO | - |
| `subject` | text | YES | - |
| `content` | text | NO | - |
| `payload` | jsonb | YES | `'{}'::jsonb` |
| `status` | varchar | NO | `'pending'` |
| `sent_at` | timestamptz | YES | - |
| `delivered_at` | timestamptz | YES | - |
| `opened_at` | timestamptz | YES | - |
| `clicked_at` | timestamptz | YES | - |
| `replied_at` | timestamptz | YES | - |
| `external_id` | varchar | YES | - |
| `error_message` | text | YES | - |
| `retry_count` | integer | YES | `0` |
| `metadata` | jsonb | YES | `'{}'::jsonb` |
| `created_at` | timestamptz | YES | `timezone('utc', now())` |
| `updated_at` | timestamptz | YES | `timezone('utc', now())` |

---

## 💳 TABLAS BILLING Y TICKETS

### 1️⃣8️⃣ **billing_tickets** {#billing_tickets}

**Propósito:** Tickets de compra (TPV integrado).

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `reservation_id` | uuid | YES | - |
| `table_id` | uuid | YES | - |
| `customer_id` | uuid | YES | - |
| `ticket_number` | varchar | NO | - |
| `external_ticket_id` | varchar | YES | - |
| `ticket_date` | timestamptz | NO | `now()` |
| `service_start` | timestamptz | YES | - |
| `service_end` | timestamptz | YES | - |
| `items` | jsonb | NO | `'[]'::jsonb` |
| `subtotal` | numeric | NO | `0` |
| `tax_amount` | numeric | NO | `0` |
| `discount_amount` | numeric | NO | `0` |
| `total_amount` | numeric | NO | `0` |
| `payment_method` | varchar | YES | - |
| `tip_amount` | numeric | YES | `0` |
| `covers_count` | integer | YES | `1` |
| `mesa_number` | varchar | YES | - |
| `waiter_name` | varchar | YES | - |
| `kitchen_notes` | text | YES | - |
| `special_requests` | text | YES | - |
| `source_system` | varchar | YES | - |
| `source_data` | jsonb | YES | - |
| `is_processed` | boolean | YES | `false` |
| `auto_matched` | boolean | YES | `false` |
| `confidence_score` | numeric | YES | `1.0` |
| `matching_notes` | text | YES | - |
| `processing_errors` | text | YES | - |
| `created_at` | timestamptz | YES | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

---

## 📈 OTRAS TABLAS IMPORTANTES

### 1️⃣9️⃣ **menu_items** {#menu_items}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `name` | varchar | NO | - |
| `description` | text | YES | - |
| `category` | varchar | NO | - |
| `price` | numeric | NO | - |
| `cost` | numeric | YES | - |
| `is_available` | boolean | YES | `true` |
| `allergens` | text[] | YES | - |
| `preparation_time` | integer | YES | - |
| `popularity_score` | integer | YES | `0` |
| `created_at` | timestamptz | YES | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

---

### 2️⃣0️⃣ **notifications** {#notifications}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `user_id` | uuid | YES | - |
| `title` | text | NO | - |
| `message` | text | NO | - |
| `type` | text | NO | - |
| `priority` | text | YES | `'normal'` |
| `is_read` | boolean | YES | `false` |
| `action_url` | text | YES | - |
| `metadata` | jsonb | YES | `'{}'::jsonb` |
| `expires_at` | timestamptz | YES | - |
| `created_at` | timestamptz | NO | `timezone('utc', now())` |
| `read_at` | timestamptz | YES | - |

---

### 2️⃣1️⃣ **profiles** {#profiles}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `auth_user_id` | uuid | NO | - |
| `email` | varchar | NO | - |
| `full_name` | varchar | YES | - |
| `avatar_url` | text | YES | - |
| `restaurant_name` | varchar | YES | - |
| `phone` | varchar | YES | - |
| `role` | varchar | YES | `'owner'` |
| `preferences` | jsonb | YES | `'{}'::jsonb` |
| `created_at` | timestamptz | NO | `timezone('utc', now())` |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` |

---

### 2️⃣2️⃣ **staff** {#staff}

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | uuid | NO | `gen_random_uuid()` |
| `restaurant_id` | uuid | NO | - |
| `auth_user_id` | uuid | YES | - |
| `name` | varchar | NO | - |
| `email` | varchar | YES | - |
| `phone` | varchar | YES | - |
| `role` | varchar | NO | - |
| `active` | boolean | YES | `true` |
| `schedule` | jsonb | YES | `'{}'::jsonb` |
| `created_at` | timestamptz | NO | `timezone('utc', now())` |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` |

---

## 🔍 RESUMEN DE RELACIONES CLAVE

```
restaurants (1) ─────┬─── (N) agent_conversations
                     ├─── (N) agent_messages
                     ├─── (N) customers
                     ├─── (N) reservations
                     ├─── (N) tables
                     ├─── (N) availability_slots
                     ├─── (N) message_templates
                     └─── (N) automation_rules

agent_conversations (1) ─── (N) agent_messages

customers (1) ─────┬─── (N) reservations
                   └─── (N) customer_interactions

reservations (N) ─── (1) tables

whatsapp_message_buffer (temporal) ──> agent_conversations (via phone)
```

---

## ✅ TABLAS ADICIONALES (Lista completa)

- `ai_conversation_insights`
- `analytics`
- `analytics_historical`
- `automation_rule_executions`
- `availability_change_log`
- `conversation_analytics`
- `crm_settings`
- `crm_suggestions`
- `crm_templates`
- `crm_v2_dashboard` (VIEW)
- `customer_feedback`
- `daily_metrics`
- `interaction_logs`
- `inventory`
- `inventory_items`
- `noshow_actions`
- `reservations_with_customer` (VIEW)
- `restaurant_business_config`
- `restaurant_settings`
- `scheduled_messages`
- `special_events`
- `template_variables`
- `user_restaurant_mapping`

---

## 🎯 REGLAS DE ORO PARA N8N

1. **NUNCA crear tablas nuevas** sin aprobación explícita
2. **USAR siempre** las tablas existentes
3. **Multi-tenant:** Filtrar SIEMPRE por `restaurant_id`
4. **Customers:** Verificar existencia antes de crear
5. **Conversations:** Crear primero, luego messages
6. **WhatsApp:** Usar buffer antes de gateway
7. **Availability:** Consultar `availability_slots` para reservas

---

**📅 Última actualización:** 2 de Octubre 2025  
**✅ Estado:** COMPLETO Y VERIFICADO

