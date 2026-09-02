INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMIN',    'Full access — holds every permission'),
  ('CATALOG_EDITOR', 'Manage products, categories and brands'),
  ('USER_MANAGER',   'Manage users and roles')
ON CONFLICT (name) DO NOTHING;

-- SUPER_ADMIN: every permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- CATALOG_EDITOR: product:* + category:manage + brand:manage.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.key IN ('product:create', 'product:read', 'product:update', 'product:delete',
               'category:manage', 'brand:manage')
WHERE r.name = 'CATALOG_EDITOR'
ON CONFLICT DO NOTHING;

-- USER_MANAGER: user:manage + role:manage.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON p.key IN ('user:manage', 'role:manage')
WHERE r.name = 'USER_MANAGER'
ON CONFLICT DO NOTHING;
