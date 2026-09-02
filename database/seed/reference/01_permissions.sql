INSERT INTO permissions (key, description) VALUES
  ('product:create',  'Create products'),
  ('product:read',    'Read products'),
  ('product:update',  'Update products'),
  ('product:delete',  'Delete products'),
  ('category:manage', 'Manage categories'),
  ('brand:manage',    'Manage brands'),
  ('user:manage',     'Manage users and their role assignments'),
  ('role:manage',     'Manage roles and their permissions')
ON CONFLICT (key) DO NOTHING;
