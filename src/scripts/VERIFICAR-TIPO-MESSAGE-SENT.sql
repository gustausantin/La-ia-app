SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'noshow_actions'
AND column_name IN ('message_sent', 'prevented_noshow');
