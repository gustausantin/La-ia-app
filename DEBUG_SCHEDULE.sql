-- VER EXACTAMENTE QUÉ HORARIOS ESTÁN GUARDADOS
SELECT 
    name,
    settings->'operating_hours' as operating_hours_raw,
    settings->'operating_hours'->'monday' as monday_config,
    settings->'operating_hours'->'tuesday' as tuesday_config,
    settings->'operating_hours'->'wednesday' as wednesday_config,
    settings->'operating_hours'->'thursday' as thursday_config,
    settings->'operating_hours'->'friday' as friday_config,
    settings->'operating_hours'->'saturday' as saturday_config,
    settings->'operating_hours'->'sunday' as sunday_config
FROM restaurants 
LIMIT 1;
