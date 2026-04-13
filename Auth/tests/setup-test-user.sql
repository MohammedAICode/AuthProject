-- Setup Test User for Auth API Tests
-- Run this script to create a test user in your database

-- Create test user with email authentication
-- Password: Test@123 (bcrypt hashed)
INSERT INTO "User" (
  id,
  email,
  username,
  firstname,
  lastname,
  password,
  "authProvider",
  "profileImg",
  "isActive",
  "isVerified",
  "createdBy",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'testuser',
  'Test',
  'User',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYqYqYqYq', -- Hash for 'Test@123'
  'EMAIL',
  NULL,
  true,
  true,
  'SYSTEM',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify test user was created
SELECT 
  id,
  email,
  username,
  firstname,
  "authProvider",
  "isActive",
  "isVerified",
  "createdAt"
FROM "User"
WHERE email = 'test@example.com';

-- Note: The password hash above is a placeholder
-- You need to generate the actual bcrypt hash for 'Test@123'
-- You can do this by:
-- 1. Using an online bcrypt generator (rounds: 12)
-- 2. Or running this Node.js code:
--    const bcrypt = require('bcrypt');
--    const hash = await bcrypt.hash('Test@123', 12);
--    console.log(hash);
