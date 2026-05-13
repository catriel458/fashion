-- 1. Tabla de tiendas
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  tagline TEXT,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  primary_color VARCHAR(7) DEFAULT '#009aae',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  font_family VARCHAR(100) DEFAULT 'Inter',
  hero_title TEXT,
  hero_subtitle TEXT,
  about_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Imágenes del carrusel de cada tienda
CREATE TABLE IF NOT EXISTS store_images (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Agregar store_id a las tablas existentes
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight INTEGER;

-- 4. Insertar la tienda Zara existente
INSERT INTO stores (name, slug, tagline, primary_color, font_family, hero_title, hero_subtitle)
VALUES ('Zara', 'zara', 'Moda para todos', '#000000', 'Inter', 'Zara', 'Moda contemporánea para cada ocasión')
ON CONFLICT (slug) DO NOTHING;

-- 5. Asignar todos los productos y categorías existentes a Zara
UPDATE products SET store_id = (SELECT id FROM stores WHERE slug = 'zara') WHERE store_id IS NULL;
UPDATE categories SET store_id = (SELECT id FROM stores WHERE slug = 'zara') WHERE store_id IS NULL;
UPDATE orders SET store_id = (SELECT id FROM stores WHERE slug = 'zara') WHERE store_id IS NULL;

-- 6. Crear superadmin por defecto (si no existe)
INSERT INTO users (username, email, password_hash, role)
SELECT 'superadmin', 'super@admin.com', '$2a$10$PLACEHOLDER', 'superadmin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin');

-- NOTA: después de migrar, la ruta /api/seed/migrate hashea la password automáticamente
