-- Migración: Agregar columna is_independent a la tabla stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_independent BOOLEAN DEFAULT false;
