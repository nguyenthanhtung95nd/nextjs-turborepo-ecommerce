INSERT INTO users (email, password_hash, name, is_active)
VALUES (
  'admin@local.dev',
  '$2b$10$lQs04oBAnBld1UYBAABhr.D/inYYznZ4.Dg6Unb0AS.Q7P.tCQBHu',
  'Local Admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'SUPER_ADMIN'
WHERE u.email = 'admin@local.dev'
ON CONFLICT DO NOTHING;
