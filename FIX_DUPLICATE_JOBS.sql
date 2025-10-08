-- ========================================
-- LIMPIAR JOBS DUPLICADOS
-- ========================================

-- 1️⃣ VER TODOS LOS JOBS (sin filtrar por jobname)
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job 
ORDER BY jobid;

-- 2️⃣ ELIMINAR TODOS LOS JOBS DE MAINTENANCE
DO $$
DECLARE
    job_record RECORD;
BEGIN
    FOR job_record IN 
        SELECT jobid 
        FROM cron.job 
        WHERE command LIKE '%daily_availability_maintenance%'
    LOOP
        PERFORM cron.unschedule(job_record.jobid);
        RAISE NOTICE 'Job % eliminado', job_record.jobid;
    END LOOP;
END $$;

-- 3️⃣ CREAR UN ÚNICO JOB LIMPIO
SELECT cron.schedule(
    'daily-availability-maintenance',
    '0 4 * * *',
    'SELECT daily_availability_maintenance();'
);

-- 4️⃣ VERIFICAR QUE SOLO HAY 1
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job 
WHERE command LIKE '%daily_availability_maintenance%';

-- Resultado esperado: 1 fila

