-- Migración: Agregar límite diario de mensajes a companies
-- Fecha: 2026-02-04

ALTER TABLE companies 
ADD COLUMN daily_message_limit INT DEFAULT 500 AFTER rate_limit_per_minute;

-- Actualizar empresa por defecto
UPDATE companies 
SET daily_message_limit = 500 
WHERE daily_message_limit IS NULL;

-- Verificar cambios
SELECT id, name, rate_limit_per_minute, daily_message_limit, is_active 
FROM companies 
ORDER BY id;