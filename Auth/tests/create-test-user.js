/**
 * Create Test User Script
 * Run this to create a test user in your database
 * Usage: node tests/create-test-user.js
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client/index.js';

const prisma = new PrismaClient();

const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  firstname: 'Test',
  lastname: 'User',
  password: 'Test@123',
  authProvider: 'EMAIL'
};

async function createTestUser() {
  try {
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);
    
    console.log('👤 Creating test user...');
    const user = await prisma.user.upsert({
      where: {
        email: TEST_USER.email
      },
      update: {
        password: hashedPassword,
        firstname: TEST_USER.firstname,
        lastname: TEST_USER.lastname,
        username: TEST_USER.username,
        authProvider: TEST_USER.authProvider,
        isActive: true,
        isVerified: true
      },
      create: {
        email: TEST_USER.email,
        username: TEST_USER.username,
        firstname: TEST_USER.firstname,
        lastname: TEST_USER.lastname,
        password: hashedPassword,
        authProvider: TEST_USER.authProvider,
        isActive: true,
        isVerified: true,
        createdBy: 'SYSTEM'
      }
    });

    console.log('✅ Test user created/updated successfully!');
    console.log('\nUser Details:');
    console.log('─────────────────────────────────────');
    console.log(`ID:           ${user.id}`);
    console.log(`Email:        ${user.email}`);
    console.log(`Username:     ${user.username}`);
    console.log(`Name:         ${user.firstname} ${user.lastname}`);
    console.log(`Auth Provider: ${user.authProvider}`);
    console.log(`Active:       ${user.isActive}`);
    console.log(`Verified:     ${user.isVerified}`);
    console.log('─────────────────────────────────────');
    console.log('\n🧪 You can now run the test suite with:');
    console.log('   node tests/auth.test.js');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
