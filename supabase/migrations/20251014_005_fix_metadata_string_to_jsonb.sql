-- Migración para convertir metadata de STRING a JSONB y sincronizar sentiment

-- Paso 1: Convertir metadata de string escapado a JSONB real
UPDATE agent_conversations
SET metadata = (metadata::text)::jsonb
WHERE jsonb_typeof(metadata) = 'string';

-- Paso 2: Sincronizar sentiment desde metadata->classification->sentiment
UPDATE agent_conversations
SET sentiment = metadata->'classification'->>'sentiment'
WHERE metadata->'classification'->>'sentiment' IS NOT NULL
  AND sentiment IS NULL;

-- Paso 3: Crear función para auto-sincronizar sentiment
CREATE OR REPLACE FUNCTION sync_sentiment_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el metadata viene como string, convertirlo a JSONB
  IF jsonb_typeof(NEW.metadata) = 'string' THEN
    NEW.metadata := (NEW.metadata::text)::jsonb;
  END IF;
  
  -- Si metadata contiene classification.sentiment, copiarlo al campo sentiment
  IF NEW.metadata->'classification'->>'sentiment' IS NOT NULL THEN
    NEW.sentiment := (NEW.metadata->'classification'->>'sentiment')::VARCHAR;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear trigger para ejecutar la función en INSERT y UPDATE
DROP TRIGGER IF EXISTS trigger_sync_sentiment ON agent_conversations;

CREATE TRIGGER trigger_sync_sentiment
BEFORE INSERT OR UPDATE OF metadata ON agent_conversations
FOR EACH ROW
EXECUTE FUNCTION sync_sentiment_from_metadata();

-- Verificación: Mostrar registros corregidos
SELECT 
  id,
  interaction_type,
  sentiment,
  metadata->'classification'->>'sentiment' as sentiment_in_metadata,
  metadata->'classification'->>'confidence' as confidence,
  jsonb_typeof(metadata) as metadata_type,
  created_at
FROM agent_conversations
WHERE interaction_type = 'feedback'
ORDER BY created_at DESC
LIMIT 10;

