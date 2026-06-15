CREATE TABLE IF NOT EXISTS superadmin_config (
  id SERIAL PRIMARY KEY,
  mp_enabled BOOLEAN DEFAULT false,
  mp_access_token TEXT,
  transfer_enabled BOOLEAN DEFAULT false,
  transfer_cbu TEXT,
  transfer_alias TEXT,
  transfer_bank TEXT,
  transfer_holder TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO superadmin_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS plan_payments (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  plan VARCHAR(20) NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  comprobante_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_plan_payments_store
  ON plan_payments(store_id, created_at);

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS plan_status VARCHAR(20) DEFAULT 'active';
