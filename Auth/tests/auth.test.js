/**
 * Auth API Test Suite
 * Run with: node tests/auth.test.js
 * 
 * Prerequisites:
 * - Server running on http://localhost:4000
 * - Test user created in database
 */

const BASE_URL = 'http://localhost:4000/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@123'
};

let cookies = {
  accessToken: '',
  refreshToken: ''
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, body = null, useCookies = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (useCookies && (cookies.accessToken || cookies.refreshToken)) {
    const cookieHeader = [];
    if (cookies.accessToken) cookieHeader.push(`accessToken=${cookies.accessToken}`);
    if (cookies.refreshToken) cookieHeader.push(`refreshToken=${cookies.refreshToken}`);
    options.headers['Cookie'] = cookieHeader.join('; ');
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Extract cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const cookieArray = setCookie.split(',');
      cookieArray.forEach(cookie => {
        if (cookie.includes('accessToken=')) {
          cookies.accessToken = cookie.split('accessToken=')[1].split(';')[0];
        }
        if (cookie.includes('refreshToken=')) {
          cookies.refreshToken = cookie.split('refreshToken=')[1].split(';')[0];
        }
      });
    }

    return {
      status: response.status,
      data,
      cookies: { ...cookies }
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

// Test utilities
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    return false;
  }
  console.log(`✅ PASSED: ${message}`);
  return true;
}

function logTestHeader(testName) {
  console.log('\n' + '='.repeat(60));
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));
}

// Test Suite
async function runTests() {
  console.log('\n🚀 Starting Auth API Test Suite...\n');
  let passedTests = 0;
  let totalTests = 0;

  // ============================================
  // 1. LOGIN TESTS
  // ============================================
  
  logTestHeader('1.1: Successful Login');
  totalTests++;
  const loginResponse = await makeRequest('POST', '/auth/login', TEST_USER);
  if (assert(loginResponse.status === 200, 'Login returns 200 status') &&
      assert(loginResponse.data.error === false, 'Login response has error: false') &&
      assert(loginResponse.data.data === TEST_USER.email, 'Login returns user email') &&
      assert(cookies.accessToken !== '', 'Access token is set in cookies') &&
      assert(cookies.refreshToken !== '', 'Refresh token is set in cookies')) {
    passedTests++;
  }
  console.log(`Cookies received: accessToken=${cookies.accessToken ? 'SET' : 'NOT SET'}, refreshToken=${cookies.refreshToken ? 'SET' : 'NOT SET'}`);

  logTestHeader('1.2: Login with Missing Email');
  totalTests++;
  const loginNoEmail = await makeRequest('POST', '/auth/login', { password: TEST_USER.password });
  if (assert(loginNoEmail.status === 400, 'Returns 400 for missing email') &&
      assert(loginNoEmail.data.error === true, 'Response has error: true')) {
    passedTests++;
  }

  logTestHeader('1.3: Login with Missing Password');
  totalTests++;
  const loginNoPassword = await makeRequest('POST', '/auth/login', { email: TEST_USER.email });
  if (assert(loginNoPassword.status === 400, 'Returns 400 for missing password') &&
      assert(loginNoPassword.data.error === true, 'Response has error: true')) {
    passedTests++;
  }

  logTestHeader('1.4: Login with Invalid Credentials');
  totalTests++;
  const loginInvalid = await makeRequest('POST', '/auth/login', { 
    email: TEST_USER.email, 
    password: 'WrongPassword123' 
  });
  if (assert(loginInvalid.status === 400, 'Returns 400 for invalid credentials') &&
      assert(loginInvalid.data.error === true, 'Response has error: true')) {
    passedTests++;
  }

  // ============================================
  // 2. ME ENDPOINT TESTS
  // ============================================

  logTestHeader('2.1: Get User Details with Valid Token');
  totalTests++;
  const meResponse = await makeRequest('GET', '/auth/me', null, true);
  if (assert(meResponse.status === 200, 'ME returns 200 status') &&
      assert(meResponse.data.data !== null, 'ME returns user data') &&
      assert(meResponse.data.data.email === TEST_USER.email, 'ME returns correct user email')) {
    passedTests++;
  }

  logTestHeader('2.2: Get User Details without Token');
  totalTests++;
  const savedCookies = { ...cookies };
  cookies.accessToken = '';
  cookies.refreshToken = '';
  const meNoToken = await makeRequest('GET', '/auth/me', null, true);
  if (assert(meNoToken.status === 401, 'Returns 401 without token') &&
      assert(meNoToken.data.error === true, 'Response has error: true')) {
    passedTests++;
  }
  cookies = savedCookies; // Restore cookies

  logTestHeader('2.3: Get User Details with Invalid Token');
  totalTests++;
  const savedCookies2 = { ...cookies };
  cookies.accessToken = 'invalid_token';
  cookies.refreshToken = 'invalid_token';
  const meInvalidToken = await makeRequest('GET', '/auth/me', null, true);
  if (assert(meInvalidToken.status === 401, 'Returns 401 with invalid token') &&
      assert(meInvalidToken.data.error === true, 'Response has error: true')) {
    passedTests++;
  }
  cookies = savedCookies2; // Restore cookies

  // ============================================
  // 3. LOGOUT TESTS
  // ============================================

  logTestHeader('3.1: Logout without Token');
  totalTests++;
  const savedCookies3 = { ...cookies };
  cookies.accessToken = '';
  cookies.refreshToken = '';
  const logoutNoToken = await makeRequest('POST', '/auth/logout', null, true);
  if (assert(logoutNoToken.status === 401, 'Returns 401 without token')) {
    passedTests++;
  }
  cookies = savedCookies3; // Restore cookies

  logTestHeader('3.2: Successful Logout');
  totalTests++;
  const logoutResponse = await makeRequest('POST', '/auth/logout', null, true);
  if (assert(logoutResponse.status === 200, 'Logout returns 200 status') &&
      assert(logoutResponse.data.error === false, 'Logout response has error: false')) {
    passedTests++;
  }

  logTestHeader('3.3: Access ME after Logout (should fail)');
  totalTests++;
  const meAfterLogout = await makeRequest('GET', '/auth/me', null, true);
  if (assert(meAfterLogout.status === 401 || meAfterLogout.status === 403, 
      'Returns 401/403 after logout')) {
    passedTests++;
  }

  // ============================================
  // 4. PASSWORD RESET TESTS
  // ============================================

  // Login again for password reset tests
  logTestHeader('4.0: Re-login for Password Reset Tests');
  await makeRequest('POST', '/auth/login', TEST_USER);

  logTestHeader('4.1: Reset Password with Wrong Old Password');
  totalTests++;
  const resetWrongOld = await makeRequest('POST', `/auth/reset-password/${TEST_USER.email}`, {
    oldPassword: 'WrongPassword',
    newPassword: 'NewTest@123'
  });
  if (assert(resetWrongOld.status === 400, 'Returns 400 for wrong old password') &&
      assert(resetWrongOld.data.error === true, 'Response has error: true')) {
    passedTests++;
  }

  logTestHeader('4.2: Reset Password for Non-existent User');
  totalTests++;
  const resetNonExistent = await makeRequest('POST', '/auth/reset-password/nonexistent@example.com', {
    oldPassword: TEST_USER.password,
    newPassword: 'NewTest@123'
  });
  if (assert(resetNonExistent.status === 400, 'Returns 400 for non-existent user') &&
      assert(resetNonExistent.data.error === true, 'Response has error: true')) {
    passedTests++;
  }

  logTestHeader('4.3: Successful Password Reset');
  totalTests++;
  const resetSuccess = await makeRequest('POST', `/auth/reset-password/${TEST_USER.email}`, {
    oldPassword: TEST_USER.password,
    newPassword: 'NewTest@123'
  });
  if (assert(resetSuccess.status === 200, 'Password reset returns 200 status') &&
      assert(resetSuccess.data.error === false, 'Password reset response has error: false')) {
    passedTests++;
  }

  logTestHeader('4.4: Access ME with Old Token (should fail - tokens revoked)');
  totalTests++;
  const meOldToken = await makeRequest('GET', '/auth/me', null, true);
  if (assert(meOldToken.status === 401 || meOldToken.status === 403, 
      'Returns 401/403 with old token after password reset')) {
    passedTests++;
  }

  logTestHeader('4.5: Login with New Password');
  totalTests++;
  const loginNewPassword = await makeRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: 'NewTest@123'
  });
  if (assert(loginNewPassword.status === 200, 'Login with new password succeeds') &&
      assert(loginNewPassword.data.error === false, 'Login response has error: false')) {
    passedTests++;
  }

  logTestHeader('4.6: Reset Password Back to Original');
  totalTests++;
  const resetBack = await makeRequest('POST', `/auth/reset-password/${TEST_USER.email}`, {
    oldPassword: 'NewTest@123',
    newPassword: TEST_USER.password
  });
  if (assert(resetBack.status === 200, 'Password reset back succeeds')) {
    passedTests++;
  }

  // ============================================
  // TEST SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(60) + '\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run the test suite
runTests().catch(error => {
  console.error('❌ Test suite failed with error:', error);
  process.exit(1);
});
